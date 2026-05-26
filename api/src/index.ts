import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { streamText, convertToModelMessages, stepCountIs } from 'ai'
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

async function registerMCPTools(
  ctx: RequestContext
): Promise<Record<string, any>> {
  if (!ctx.userId) {
    return {}
  }
  const { registerRuntimeMCPTools } = await import('./mcp/service.ts')
  return registerRuntimeMCPTools({
    viewerId: ctx.userId,
    env: ctx.env,
  })
}

const DSML_BLOCK_PATTERN = /<｜｜DSML｜｜tool_calls>[\s\S]*?<\/｜｜DSML｜｜tool_calls>/g
const DSML_TAG_PATTERN = /<\/?｜｜DSML｜｜[^<>]*>/g
const DSML_HOLDBACK_PREFIX = '<'

function cleanDsml(text: string): string {
  return text.replace(DSML_BLOCK_PATTERN, '').replace(DSML_TAG_PATTERN, '')
}

const stripDsmlTransform = () => {
  let buffer = ''
  return new TransformStream<any, any>({
    transform(part, controller) {
      if (part.type !== 'text-delta' || typeof part.text !== 'string') {
        if (buffer && (part.type === 'text-end' || part.type === 'finish-step' || part.type === 'finish')) {
          const flushed = cleanDsml(buffer)
          buffer = ''
          if (flushed) {
            controller.enqueue({ type: 'text-delta', id: part.id, text: flushed })
          }
        }
        controller.enqueue(part)
        return
      }
      buffer += part.text
      const lastUnsafeIdx = buffer.lastIndexOf(DSML_HOLDBACK_PREFIX)
      let safeBoundary = buffer.length
      if (lastUnsafeIdx >= 0) {
        const tail = buffer.slice(lastUnsafeIdx)
        const isCompleteTag = /^<\/?｜｜DSML｜｜[^<>]*>/.test(tail)
        if (!isCompleteTag) {
          safeBoundary = lastUnsafeIdx
        }
      }
      const safe = buffer.slice(0, safeBoundary)
      buffer = buffer.slice(safeBoundary)
      const cleaned = cleanDsml(safe)
      if (cleaned) {
        controller.enqueue({ ...part, text: cleaned })
      }
    },
    flush(controller) {
      if (buffer) {
        const cleaned = cleanDsml(buffer)
        buffer = ''
        if (cleaned) {
          controller.enqueue({ type: 'text-delta', id: 'flush', text: cleaned })
        }
      }
    },
  })
}

const ALLOWED_ORIGINS = [
  'https://iguide.chat',
  'https://app.iguide.chat',
  'http://localhost:5173',
  'http://localhost:3000',
]

const PREVIEW_ORIGIN_PATTERNS: RegExp[] = [
  /^https:\/\/[a-z0-9-]+\.iguide-6d0\.pages\.dev$/i,
]

function isAllowedOrigin(origin: string | undefined): origin is string {
  if (!origin) return false
  if (ALLOWED_ORIGINS.includes(origin)) return true
  return PREVIEW_ORIGIN_PATTERNS.some((re) => re.test(origin))
}

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

app.use(
  '*',
  cors({
    origin: (origin) => (isAllowedOrigin(origin) ? origin : ''),
    allowMethods: ['GET', 'POST', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    maxAge: 86400,
  })
)

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

// Optional auth: signed-in users get payload.sub; guests get guest_<ipHash>
// so per-user rate limiting and MCP global-visibility filtering still apply.
async function guestUserIdForIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip)
  const hash = await crypto.subtle.digest('SHA-256', data)
  const hex = Array.from(new Uint8Array(hash).slice(0, 8))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
  return `guest_${hex}`
}

const resolveUser = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization')
  const token =
    authHeader && authHeader.startsWith('Bearer ')
      ? authHeader.replace('Bearer ', '').trim()
      : ''

  if (token) {
    const payload = await verifyAndCacheJwt(token, caches.default, c.env)
    if (payload) {
      c.set('userId', payload.sub)
      await next()
      return
    }
  }

  const ip = c.req.header('cf-connecting-ip') || 'unknown'
  c.set('userId', await guestUserIdForIp(ip))
  await next()
}

// POST /chat with auth + rate limiting + streamText
app.post(
  '/chat',
  resolveUser,
  async (c, next) => ipRateLimit(c.env.CHAT_IP_LIMITER)(c, next),
  async (c, next) => userRateLimit(c.env.CHAT_USER_LIMITER)(c, next),
  async (c) => {
    const body = await c.req.json()
    const { messages: rawMessages, conversationId, lang = 'en' } = body

    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return c.json({ error: 'Messages array required' }, 400)
    }

    // Convert UIMessages (from @ai-sdk/react) to ModelMessages (for streamText)
    const messages = await convertToModelMessages(rawMessages)

    const userId = c.get('userId')
    const region = c.get('region')

    const ctx: RequestContext = {
      env: c.env as any,
      userId,
      region,
    }

    // Build tools only if user query is substantive
    const lastMessage = messages[messages.length - 1]
    const lastContent = lastMessage?.content
    const userText =
      typeof lastContent === 'string'
        ? lastContent
        : Array.isArray(lastContent)
          ? lastContent
              .filter((p: any) => p.type === 'text')
              .map((p: any) => p.text)
              .join('')
          : ''
    const shouldUseTool = userText.length > 3

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

    const provider = resolveProvider({
      env: c.env as unknown as Record<string, string | undefined>,
      region: region as 'CN' | 'Global',
    })
    const model = provider('deepseek-v4-flash')

    const systemPrompt =
      lang === 'zh'
        ? '你是 IlliniGuide AI 助手，专门帮助 UIUC 学生解答关于校园生活、课程、住宿等问题。'
        : 'You are IlliniGuide AI assistant, helping UIUC students with campus life, courses, housing, and more.'

    const MAX_STEPS = 8
    const result = streamText({
      model,
      system: systemPrompt,
      messages,
      tools,
      // AI SDK v6 streamText defaults to stepCountIs(1); without a wider budget,
      // the tool-call consumes the only step and the model never produces a text reply.
      stopWhen: stepCountIs(MAX_STEPS),
      // On the final allowed step, force the model to answer in text instead of
      // calling yet another tool. Otherwise a model that keeps trying tools will
      // exhaust the step budget without producing a reply.
      prepareStep: ({ stepNumber }) => {
        if (stepNumber >= MAX_STEPS - 1) {
          const finalSystem =
            lang === 'zh'
              ? `${systemPrompt}\n\n注意：你已用完工具调用次数。请直接基于到目前为止收集到的信息用中文回答用户的问题，不要再尝试调用任何工具。`
              : `${systemPrompt}\n\nNote: You have exhausted your tool budget. Answer the user's question directly in English using whatever information you have gathered so far. Do not attempt to call any further tools.`
          return { toolChoice: 'none', system: finalSystem }
        }
        return {}
      },
      // DeepSeek occasionally emits its native DSML tool-call markup as text when
      // toolChoice is 'none'. Strip these markers from text deltas so the user
      // never sees them.
      experimental_transform: stripDsmlTransform,
      onFinish: async ({ response }) => {
        if (userId.startsWith('guest_')) {
          return
        }
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

    return result.toUIMessageStreamResponse()
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
  return c.json(
    {
      error: 'Not found',
      path: new URL(c.req.url).pathname,
    },
    404
  )
})

// Error handler
app.onError((err, c) => {
  console.error('Worker error:', err)
  return c.json(
    {
      error: 'Internal server error',
      message: err.message,
    },
    500
  )
})

export default app
