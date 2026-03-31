// [FUNCTION] QMD search proxy — direct fetch to QMD server.
type PagesFunction<T = unknown> = (context: {
    request: Request;
    env: T;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
}) => Promise<Response>;

interface Env {
    QMD_CN_URL?: string;
    QMD_US_URL?: string;
    QMD_API_KEY?: string;
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;
    const body = await request.text();
    const apiKey = env.QMD_API_KEY || '';
    const errors: string[] = [];

    const nodes = [
        { url: env.QMD_CN_URL, region: 'cn' },
        { url: env.QMD_US_URL, region: 'us' },
    ].filter(n => n.url);

    for (const node of nodes) {
        try {
            const res = await fetch(`${node.url}/api/search`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}),
                },
                body,
            });
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
            errors.push(`${node.region}: HTTP ${res.status}`);
        } catch (e: any) {
            errors.push(`${node.region}: ${e?.message || e}`);
        }
    }

    return new Response(
        JSON.stringify({ error: 'QMD search unavailable', debug: { urls: nodes.map(n => n.url), errors } }),
        { status: 503, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
};

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
};
