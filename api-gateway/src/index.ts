// API Gateway Worker for api.iguide.chat
// Handles: Auth verification, Geo-IP routing, LLM selection, Backend proxy

interface Env {
    SUPABASE_URL: string;
    SUPABASE_ANON_KEY: string;
    DEEPSEEK_API_KEY: string;
    SILICONFLOW_API_KEY: string;
    BACKEND_URL: string; // Argo Tunnel URL to VPS
}

export default {
    async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*', // TODO: Change to your frontend domain in production
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Max-Age': '86400',
        };

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: corsHeaders,
            });
        }

        try {
            const url = new URL(request.url);

            // 1. Geo-IP Detection
            const cf = (request as any).cf;
            const country = cf?.country || 'US';
            const isCN = country === 'CN';
            const region = isCN ? 'CN' : 'Global';

            console.log(`Request from ${country}, region: ${region}`);

            // 2. Auth Verification (JWT)
            const authHeader = request.headers.get('Authorization');
            let userId = 'anonymous';
            let isAuthenticated = false;

            if (authHeader && authHeader.startsWith('Bearer ')) {
                try {
                    const token = authHeader.replace('Bearer ', '');

                    // Verify JWT with Supabase
                    const supabaseResponse = await fetch(
                        `${env.SUPABASE_URL}/auth/v1/user`,
                        {
                            headers: {
                                'Authorization': `Bearer ${token}`,
                                'apikey': env.SUPABASE_ANON_KEY,
                            },
                        }
                    );

                    if (supabaseResponse.ok) {
                        const userData = await supabaseResponse.json();
                        userId = userData.id;
                        isAuthenticated = true;
                        console.log(`Authenticated user: ${userId}`);
                    } else {
                        console.warn('Invalid token');
                        return new Response(
                            JSON.stringify({ error: 'Invalid or expired token' }),
                            {
                                status: 401,
                                headers: {
                                    ...corsHeaders,
                                    'Content-Type': 'application/json',
                                },
                            }
                        );
                    }
                } catch (err) {
                    console.error('Auth error:', err);
                    return new Response(
                        JSON.stringify({ error: 'Authentication failed' }),
                        {
                            status: 500,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                }
            }

            // 3. Route based on path
            const pathname = url.pathname;

            // Health check endpoint
            if (pathname === '/health' || pathname === '/api/health') {
                return new Response(
                    JSON.stringify({
                        status: 'ok',
                        region,
                        country,
                        authenticated: isAuthenticated,
                        timestamp: new Date().toISOString(),
                        version: '1.0.0',
                    }),
                    {
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'application/json',
                        },
                    }
                );
            }

            // Chat endpoint - proxy to VPS backend
            if (pathname === '/chat' || pathname === '/api/chat') {
                if (request.method !== 'POST') {
                    return new Response(
                        JSON.stringify({ error: 'Method not allowed' }),
                        {
                            status: 405,
                            headers: {
                                ...corsHeaders,
                                'Content-Type': 'application/json',
                            },
                        }
                    );
                }

                // Forward request to VPS backend
                const backendResponse = await fetch(env.BACKEND_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-User-Region': region,
                        'X-User-Country': country,
                        'X-User-ID': userId,
                        'X-Authenticated': isAuthenticated.toString(),
                    },
                    body: await request.text(),
                });

                // Handle streaming response (SSE)
                const contentType = backendResponse.headers.get('content-type') || '';
                if (contentType.includes('text/event-stream')) {
                    return new Response(backendResponse.body, {
                        status: backendResponse.status,
                        headers: {
                            ...corsHeaders,
                            'Content-Type': 'text/event-stream',
                            'Cache-Control': 'no-cache',
                            'Connection': 'keep-alive',
                        },
                    });
                }

                // Regular JSON response
                const responseData = await backendResponse.text();
                return new Response(responseData, {
                    status: backendResponse.status,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                });
            }

            // 404 for unknown paths
            return new Response(
                JSON.stringify({
                    error: 'Not found',
                    path: pathname,
                    availableEndpoints: ['/health', '/chat'],
                }),
                {
                    status: 404,
                    headers: {
                        ...corsHeaders,
                        'Content-Type': 'application/json',
                    },
                }
            );
        } catch (error: any) {
            console.error('Worker error:', error);
            return new Response(
                JSON.stringify({
                    error: 'Internal server error',
                    message: error.message,
                }),
                {
                    status: 500,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                }
            );
        }
    },
};
