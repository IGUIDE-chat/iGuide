// [FUNCTION] Middleware for Auth and Geo-Routing
// [函数] 用于身份验证和地理路由的中间件

import { createClient } from '@supabase/supabase-js';

// Shim for Cloudflare Pages Functions type
interface Env {
    VITE_SUPABASE_URL: string;
    VITE_SUPABASE_ANON_KEY: string;
    VITE_DEEPSEEK_API_KEY?: string;
    VITE_SILICONFLOW_API_KEY?: string;
}

type PagesFunction<T = unknown> = (context: {
    request: Request;
    env: T;
    data: Record<string, unknown>;
    next: () => Promise<Response>;
}) => Promise<Response>;

export const onRequest: PagesFunction<Env> = async (context) => {
    const { request, env, data, next } = context;

    // 1. Geo-IP Routing Logic
    // Cloudflare injects 'cf' object into the request (real workers)
    // or we get it from headers 'cf-ipcountry'
    const cf = (request as any).cf;
    const country = cf?.country || request.headers.get('cf-ipcountry') || 'US';

    // Tag request with region for backend consumption
    // CN Region = China (CN)
    const isCN = country === 'CN';
    const regionTag = isCN ? 'CN' : 'Global';

    // Clone request to add headers
    const newRequest = new Request(request);
    newRequest.headers.set('X-User-Region', regionTag);
    newRequest.headers.set('X-User-Country', country as string);

    // 2. Auth Verification (Supabase JWT)
    // Only verify specific paths (e.g. /api/*)
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
        const authHeader = request.headers.get('Authorization');
        if (!authHeader) {
            // Allow specific public endpoints if any, otherwise block
            // return new Response("Missing Authorization Header", { status: 401 });
            // For now we might pass through if we allow anon chat, 
            // but let's parse if present to set user context.
        } else {
            try {
                const token = authHeader.replace('Bearer ', '');
                const supabase = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY);
                const { data: { user }, error } = await supabase.auth.getUser(token);

                if (error || !user) {
                    // Invalid token
                    return new Response("Invalid Token", { status: 401 });
                }

                // Inject user ID
                newRequest.headers.set('X-User-ID', user.id);

                // Pass to next function in the chain
            } catch (err) {
                return new Response("Auth Error", { status: 500 });
            }
        }
    }

    // Pass existing context but with modified request
    // Note: Pages Middleware signature doesn't easily allow swapping 'request' in 'context' 
    // without re-constructing. 
    // Standard way: Use context.next() but we can't mutate request easily?
    // We can attach data to 'context.data' which downstream functions access.

    data.region = regionTag;
    data.country = country;
    data.isCN = isCN;

    return next();
};
