import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamText } from 'ai'
import { verifyAndCacheJwt } from './auth/jwtCache.ts'
import { ipRateLimit, userRateLimit } from './middleware/ratelimit.ts'
import { createSearchKnowledgeBaseTool } from './tools/searchKnowledgeBase.ts'
import { createWebSearchTool } from './tools/webSearch.ts'
import { createGrepDocsTool } from './tools/grepDocs.ts'
import { createCustomSkillsTool } from './tools/customSkills.ts'
import { toolDefToAISDK } from './tools/mcpAdapter.ts'
import type { RequestContext } from './tools/types.ts'
import { resolveProvider } from './agent/provider.ts'
import { persistTurn } from './agent/persist.ts'

interface Env {
  SUPABASE_URL: string
  SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  DEEPSEEK_API_KEY: string
  DEEPSEEK_ENDPOINT?: string
  SILICONFLOW_API_KEY?: string
  TAVILY_API_KEY: string
  EMBEDDING_API_BASE_URL: string
  EMBEDDING_API_KEY: string
  EMBEDDING_MODEL: string
  EMBEDDING_DIMENSIONS: string
  EMBEDDING_FALLBACK_URL?: string
  QMD_CN_URL?: string
  QMD_US_URL?: string
  QMD_API_KEY?: string
  CHAT_IP_LIMITER: any
  CHAT_USER_LIMITER: any
}

type Variables = {
  userId: string
  region: string
}

async function registerMCPTools(ctx: RequestContext): Promise<Record<string, any>> {
  if (!ctx.userId) {
    return {}
  }
  const { registerRuntimeMCPTools } = await import('./mcp/service.ts')
  return registerRuntimeMCPTools({
    viewerId: ctx.userId,
    env: ctx.env,
  })
}

const ALLOWED_ORIGINS = [
  'https://iguide.chat',
  'https://app.iguide.chat',
  'http://localhost:5173',
  'http://localhost:3000',
]

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// CORS middleware
app.use('*', cors({
  origin: (origin) => ALLOWED_ORIGINS.includes(origin) ? origin : '',
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}))

// Region detection middleware
app.use('*', async (c, next) => {
  const country = (c.req.raw as any).cf?.country || 'US'
  const region = country === 'CN' ? 'CN' : 'Global'
  c.set('region', region)
  await next()
})

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    region: c.get('region'),
    timestamp: new Date().toISOString(),
  })
})

// Auth middleware for /chat
const authMiddleware = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401)
  }

  const token = authHeader.replace('Bearer ', '')
  const payload = await verifyAndCacheJwt(token, caches.default, c.env)

  if (!payload) {
    return c.json({ error: 'Invalid or expired token' }, 401)
  }

  c.set('userId', payload.sub)
  await next()
}

// POST /chat with auth + rate limiting + streamText
app.post(
  '/chat',
  authMiddleware,
  async (c, next) => ipRateLimit(c.env.CHAT_IP_LIMITER)(c, next),
  async (c, next) => userRateLimit(c.env.CHAT_USER_LIMITER)(c, next),
  async (c) => {
    const body = await c.req.json()
    const { messages, conversationId, lang = 'en' } = body

    if (!Array.isArray(messages) || messages.length === 0) {
      return c.json({ error: 'Messages array required' }, 400)
    }

    const userId = c.get('userId')
    const region = c.get('region')

    const ctx: RequestContext = {
      env: c.env as any,
      userId,
      region,
    }

    // Build tools only if user query is substantive
    const lastMessage = messages[messages.length - 1]
    const userText = lastMessage?.content || ''
    const shouldUseTool = typeof userText === 'string' && userText.length > 3

    let tools: Record<string, any> = {}
    if (shouldUseTool) {
      tools = {
        search_knowledge_base: createSearchKnowledgeBaseTool(ctx),
        web_search: createWebSearchTool(ctx),
        grep_docs: createGrepDocsTool(ctx),
        custom_skills: createCustomSkillsTool(ctx),
        ...(await registerMCPTools(ctx)),
      }
    }

    const provider = resolveProvider({ env: c.env as unknown as Record<string, string | undefined>, region: region as 'CN' | 'Global' })
    const model = provider('deepseek-v4-flash')

    const systemPrompt = lang === 'zh'
      ? '你是 IlliniGuide AI 助手，专门帮助 UIUC 学生解答关于校园生活、课程、住宿等问题。'
      : 'You are IlliniGuide AI assistant, helping UIUC students with campus life, courses, housing, and more.'

    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools,
      onFinish: async ({ response }) => {
        c.executionCtx.waitUntil(
          persistTurn({
            env: c.env as any,
            userId,
            conversationId,
            userMessage: { role: 'user', content: userText },
            responseMessages: response.messages as any[],
          })
        )
      },
      onError: (error) => {
        console.error('[streamText] Error:', error)
      },
    })

    return result.toTextStreamResponse()
  }
)

// QMD search endpoints
async function fetchQmd(
  baseUrl: string,
  body: string,
  apiKey: string,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(`${baseUrl}/api/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
      },
      body,
      signal: controller.signal,
    })
    return res
  } finally {
    clearTimeout(timer)
  }
}

app.post('/api/search', async (c) => {
  const body = await c.req.text()
  const region = c.get('region')
  const isCN = region === 'CN'

  const [primaryUrl, fallbackUrl] = isCN
    ? [c.env.QMD_CN_URL, c.env.QMD_US_URL]
    : [c.env.QMD_US_URL, c.env.QMD_CN_URL]

  let qmdRegion = isCN ? 'cn' : 'us'
  let res: Response | null = null

  if (primaryUrl) {
    try {
      res = await fetchQmd(primaryUrl, body, c.env.QMD_API_KEY || '', 15000)
      if (!res.ok) res = null
    } catch {
      console.warn(`[QMD] Primary node (${qmdRegion}) failed`)
      res = null
    }
  }

  if (!res && fallbackUrl) {
    try {
      qmdRegion = isCN ? 'us' : 'cn'
      res = await fetchQmd(fallbackUrl, body, c.env.QMD_API_KEY || '', 15000)
    } catch (err) {
      console.error('[QMD] Fallback node failed:', err)
    }
  }

  if (res && res.ok) {
    const data = await res.text()
    return c.json(JSON.parse(data), 200, {
      'X-QMD-Region': qmdRegion,
    })
  }

  return c.json({ error: 'QMD search unavailable' }, 503)
})

app.post('/search', async (c) => {
  const url = new URL(c.req.url)
  url.pathname = '/api/search'
  const newReq = new Request(url.toString(), {
    method: 'POST',
    headers: c.req.raw.headers,
    body: c.req.raw.body,
  })
  return app.fetch(newReq, c.env, c.executionCtx)
})

// MCP integrations routes (stub for T9)
app.all('/integrations/*', async (c) => {
  return c.json({ error: 'MCP integrations not yet implemented' }, 501)
})

// 404 handler
app.notFound((c) => {
  return c.json({
    error: 'Not found',
    path: new URL(c.req.url).pathname,
  }, 404)
})

// Error handler
app.onError((err, c) => {
  console.error('Worker error:', err)
  return c.json({
    error: 'Internal server error',
    message: err.message,
  }, 500)
})

export default app
