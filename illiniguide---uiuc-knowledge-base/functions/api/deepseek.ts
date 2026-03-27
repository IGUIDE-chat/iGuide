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
}

const DEFAULT_SYSTEM_PROMPT =
    'You are the IlliniGuide Housing Assistant for UIUC dorm selection. Be concise and practical.';

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const apiKey = (env.DEEPSEEK_API_KEY || env.VITE_DEEPSEEK_API_KEY || '').trim();
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'Missing DEEPSEEK_API_KEY in server environment.' }),
                { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
        }

        const body = (await request.json()) as DeepSeekBody;

        let messages: Array<{ role: string; content: string }>;

        if (Array.isArray(body.messages) && body.messages.length > 0) {
            // Direct messages format (used by DormDetail translation)
            messages = body.messages;
        } else {
            // Legacy format: { newMessage, systemInstruction, history }
            const history = Array.isArray(body.history) ? body.history : [];
            const newMessage = typeof body.newMessage === 'string' ? body.newMessage.trim() : '';
            const systemInstruction =
                typeof body.systemInstruction === 'string' && body.systemInstruction.trim()
                    ? body.systemInstruction
                    : DEFAULT_SYSTEM_PROMPT;

            if (!newMessage) {
                return new Response(JSON.stringify({ error: 'newMessage is required.' }), {
                    status: 400,
                    headers: { 'Content-Type': 'application/json' }
                });
            }

            messages = [
                { role: 'system', content: systemInstruction },
                ...history.map((item) => ({
                    role: item.role === 'model' ? 'assistant' : 'user',
                    content: item.text
                })),
                { role: 'user', content: newMessage }
            ];
        }

        const deepSeekResponse = await fetch('https://api.deepseek.com/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: 'deepseek-chat',
                messages,
                stream: false
            })
        });

        if (!deepSeekResponse.ok) {
            const errorText = await deepSeekResponse.text().catch(() => '');
            return new Response(
                JSON.stringify({
                    error: 'DeepSeek request failed.',
                    status: deepSeekResponse.status,
                    details: errorText
                }),
                {
                    status: deepSeekResponse.status,
                    headers: { 'Content-Type': 'application/json' }
                }
            );
        }

        const data = (await deepSeekResponse.json()) as any;
        const reply = data?.choices?.[0]?.message?.content || '';

        return new Response(JSON.stringify({ reply }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error?.message || 'Unexpected server error.' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }
};
