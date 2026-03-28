// [FUNCTION] DeepSeek Chat API proxy — supports both streaming (SSE) and non-streaming.
// [函数] DeepSeek 聊天 API 代理 — 支持流式 (SSE) 和非流式响应。
type PagesFunction<T = unknown> = (context: {
    request: Request;
    env: T;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
}) => Promise<Response>;

interface Env {
    DEEPSEEK_API_KEY?: string;
    VITE_DEEPSEEK_API_KEY?: string;
}

interface ChatItem {
    role: 'user' | 'model';
    text: string;
}

interface DeepSeekBody {
    history?: ChatItem[];
    newMessage?: string;
    systemInstruction?: string;
    messages?: Array<{ role: string; content: string }>;
    stream?: boolean;
    lang?: 'en' | 'zh';
}

const DEFAULT_SYSTEM_PROMPT = `You are IlliniGuide, the UIUC campus assistant. You help students with housing, dining, academics, transportation, and campus life at the University of Illinois Urbana-Champaign.

Rules:
- Be concise, practical, and friendly.
- When asked about dorms, include pricing, location, amenities, and pros/cons.
- Support both English and Chinese responses based on user language.
- If you don't know something specific, say so rather than guessing.`;

function buildMessages(body: DeepSeekBody): Array<{ role: string; content: string }> {
    if (Array.isArray(body.messages) && body.messages.length > 0) {
        return body.messages;
    }

    const history = Array.isArray(body.history) ? body.history : [];
    const newMessage = typeof body.newMessage === 'string' ? body.newMessage.trim() : '';
    const systemInstruction =
        typeof body.systemInstruction === 'string' && body.systemInstruction.trim()
            ? body.systemInstruction
            : DEFAULT_SYSTEM_PROMPT;

    const langHint = body.lang === 'zh'
        ? '\n\nThe user prefers Chinese. Respond in Chinese unless they write in English.'
        : '';

    return [
        { role: 'system', content: systemInstruction + langHint },
        ...history.map((item) => ({
            role: item.role === 'model' ? 'assistant' : 'user',
            content: item.text,
        })),
        ...(newMessage ? [{ role: 'user', content: newMessage }] : []),
    ];
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const apiKey = (env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY || '').trim();
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'Missing DEEPSEEK_API_KEY in server environment.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } },
            );
        }

        const body = (await request.json()) as DeepSeekBody;
        const messages = buildMessages(body);
        const useStream = body.stream !== false; // default to streaming

        if (!useStream) {
            // ── Non-streaming (legacy: translation, etc.) ──
            const resp = await fetch('https://api.deepseek.com/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({ model: 'deepseek-chat', messages, stream: false, temperature: 0.8 }),
            });

            if (!resp.ok) {
                const errText = await resp.text().catch(() => '');
                return new Response(
                    JSON.stringify({ error: 'DeepSeek request failed.', status: resp.status, details: errText }),
                    { status: resp.status, headers: { 'Content-Type': 'application/json' } },
                );
            }

            const data = (await resp.json()) as any;
            const reply = data?.choices?.[0]?.message?.content || '';
            return new Response(JSON.stringify({ reply }), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        // ── Streaming (SSE) ──
        const resp = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({ model: 'deepseek-chat', messages, stream: true, temperature: 0.8 }),
        });

        if (!resp.ok) {
            const errText = await resp.text().catch(() => '');
            return new Response(
                JSON.stringify({ error: 'DeepSeek request failed.', status: resp.status, details: errText }),
                { status: resp.status, headers: { 'Content-Type': 'application/json' } },
            );
        }

        // Pipe the SSE stream directly to the client
        return new Response(resp.body, {
            status: 200,
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error?.message || 'Unexpected server error.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } },
        );
    }
};
