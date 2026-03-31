// [FUNCTION] QMD search proxy — forwards to api-gateway Worker for geo-routed QMD search.
// [函数] QMD 搜索代理 — 转发到 api-gateway Worker 进行地理路由搜索。
type PagesFunction<T = unknown> = (context: {
    request: Request;
    env: T;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
}) => Promise<Response>;

interface Env {
    API_GATEWAY_URL?: string; // e.g. https://api.iguide.chat
    QMD_CN_URL?: string;     // Direct fallback: Alibaba Cloud QMD
    QMD_US_URL?: string;     // Direct fallback: Chicago VPS QMD
    QMD_API_KEY?: string;
}

async function fetchWithTimeout(url: string, body: string, apiKey: string, timeoutMs: number): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
        return await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
            },
            body,
            signal: controller.signal,
        });
    } finally {
        clearTimeout(timer);
    }
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const body = await request.text();

    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    const apiKey = env.QMD_API_KEY || '';

    // Strategy 1: Direct to QMD nodes (faster than routing through api-gateway)
    // Try CN first (most users are in China), then US as fallback.
    const nodes = [
        { url: env.QMD_CN_URL, region: 'cn', timeout: 15000 },
        { url: env.QMD_US_URL, region: 'us', timeout: 15000 },
    ].filter(n => n.url);

    for (const node of nodes) {
        try {
            const res = await fetchWithTimeout(`${node.url}/api/search`, body, apiKey, node.timeout);
            if (res.ok) {
                const data = await res.text();
                return new Response(data, {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'X-QMD-Region': node.region,
                    },
                });
            }
        } catch {
            console.warn(`[search] Node ${node.region} failed`);
        }
    }

    // Strategy 2: Fallback to api-gateway Worker (has its own geo-routing)
    if (env.API_GATEWAY_URL) {
        try {
            const res = await fetchWithTimeout(
                `${env.API_GATEWAY_URL}/api/search`,
                body,
                '',
                15000,
            );
            if (res.ok) {
                const data = await res.text();
                return new Response(data, {
                    status: 200,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                        'X-QMD-Region': res.headers.get('X-QMD-Region') || 'gateway',
                    },
                });
            }
        } catch {
            console.warn('[search] api-gateway also unreachable');
        }
    }

    return new Response(
        JSON.stringify({
            error: 'QMD search unavailable',
            debug: {
                hasGateway: !!env.API_GATEWAY_URL,
                hasCN: !!env.QMD_CN_URL,
                hasUS: !!env.QMD_US_URL,
                hasKey: !!env.QMD_API_KEY,
                nodesCount: nodes.length,
            },
        }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
};

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
    });
};
