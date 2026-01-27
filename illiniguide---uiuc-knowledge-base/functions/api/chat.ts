// [FUNCTION] Serverless function handling chat requests and API proxying.
// [函数] 处理聊天请求和 API 代理的无服务器函数。
// Shim for Cloudflare Pages Functions type
type PagesFunction<T = unknown> = (context: {
    request: Request;
    env: T;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
}) => Promise<Response>;

interface Env {
    COZE_CLIENT_ID: string;
    COZE_PRIVATE_KEY: string; // The private key PEM content
    COZE_BOT_ID: string;
    COZE_API_TOKEN?: string;
    VITE_COZE_API_KEY?: string;
    VITE_COZE_BOT_ID?: string;
    VITE_BACKEND_URL?: string;
}

// Helper to generate JWT (Minimal implementation or import remote library if needed)
// Cloudflare Workers run on V8, crypto.subtle is available.
// For simplicity in this demo, we assume the environment might provide the token or we do a simple PAT-like request first if OAuth is too complex for a single file without libraries using `jose`.
// WAIT: Standard Coze OAuth requires signing JWT. JS native crypto is complex.
// ALTERNATIVE: Use PAT in Backend (Functions) is also "Secure" because it's server-side.
// If User strictly wants "OAuth App", we need to sign JWT.
// Let's check if we can use a simpler approach or if we need `jose` (npm install jose).
// Cloudflare Pages Functions supports npm modules if we commit package.json.
// Assuming we stick to PAT for simplicity in "Backend Proxy" first, unless user insists on "OAuth App" specifically for the logic.
// User said "Coze OAuth Apps". Okay, I will try to implement JWT signing if possible, OR standard OAuth (Client Secret).
// Coze OAuth for Server-to-Server usually uses JWT (JWT Auth).
// Let's implement a Proxy that uses PAT first as it's 100% working and secure in backend.
// IF user insists on OAuth, we need to add `jose` dependency.
// I will start with a PROXY that hides the Key. Whether that Key is PAT or OAuth Token is an implementation detail.
// I will implement standard PAT proxy first for stability, but name variables generic enough.
// ACTUALLY: Coze "OAuth App" can be "Web OAuth" (Login to Coze) or "Service OAuth" (S2S).
// Assuming S2S for a chatbot.

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env, data } = context;

    try {
        const body = await request.json() as any;

        // Use injected data from middleware
        const region = data.region as string || 'Global';
        const userId = request.headers.get('X-User-ID') || 'anon';

        // VPS Backend Endpoint (Tunnel URL or Direct IP)
        // In production, this would be an Argo Tunnel hostname e.g. "https://api.illiniguide.com/api/v1/chat"
        // For development/demo, we use a placeholder or local env var.
        const BACKEND_URL = env.VITE_BACKEND_URL || "http://localhost:8000/api/v1/chat";

        // Forward request to Python Core
        const backendRes = await fetch(BACKEND_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "X-User-Region": region,
                "X-User-ID": userId,
                // Pass auth token if backend needs to verify again or use it
                "Authorization": request.headers.get("Authorization") || ""
            },
            body: JSON.stringify({
                query: body.message,
                conversation_id: body.conversationId,
                history: body.history,
                stream: true
            })
        });

        // Handle streaming response from Python
        if (!backendRes.ok) {
            const errorText = await backendRes.text();
            return new Response(JSON.stringify({ error: `Backend Error: ${errorText}` }), { status: backendRes.status });
        }

        const { readable, writable } = new TransformStream();
        backendRes.body?.pipeTo(writable);

        return new Response(readable, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                "Connection": "keep-alive"
            }
        });

    } catch (err) {
        return new Response(JSON.stringify({ error: err.message }), { status: 500 });
    }
}
