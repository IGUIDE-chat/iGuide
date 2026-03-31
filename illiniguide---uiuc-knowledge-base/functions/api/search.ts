// [FUNCTION] QMD search proxy — calls api-gateway Worker via Service Binding.
// [函数] QMD 搜索代理 — 通过 Service Binding 调用 api-gateway Worker。
type PagesFunction<T = unknown> = (context: {
    request: Request;
    env: T;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
}) => Promise<Response>;

interface Env {
    QMD_WORKER?: { fetch: typeof fetch }; // Service Binding to api-gateway Worker
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    if (!env.QMD_WORKER) {
        return new Response(
            JSON.stringify({ error: 'QMD_WORKER service binding not configured' }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }

    try {
        // Call api-gateway Worker directly via Service Binding (no network hop)
        const res = await env.QMD_WORKER.fetch(
            new Request('https://api-gateway/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: request.body,
            }),
        );

        const data = await res.text();
        return new Response(data, {
            status: res.status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'application/json',
                'X-QMD-Region': res.headers.get('X-QMD-Region') || 'binding',
            },
        });
    } catch (e: any) {
        return new Response(
            JSON.stringify({ error: 'QMD search failed', detail: e?.message || String(e) }),
            { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }
};

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        status: 204,
        headers: corsHeaders,
    });
};
