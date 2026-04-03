// [FUNCTION] Free comment translation proxy using Google Gemini (free tier).
// [函数] 免费评论翻译代理，使用 Google Gemini 免费层（gemini-1.5-flash）。
// Free tier: 15 RPM, 1500 RPD — zero cost.
type PagesFunction<T = unknown> = (context: {
    request: Request;
    env: T;
    params: Record<string, string>;
    waitUntil: (promise: Promise<any>) => void;
    next: () => Promise<Response>;
    data: Record<string, unknown>;
}) => Promise<Response>;

interface Env {
    GOOGLE_API_KEY?: string;
}

interface TranslateBody {
    text: string;
    targetLang: string; // e.g. "English", "Chinese (Simplified)", "Japanese", "Korean"
}

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
};

export const onRequestOptions: PagesFunction = async () => {
    return new Response(null, { status: 204, headers: corsHeaders });
};

export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const apiKey = (env.GOOGLE_API_KEY || '').trim();
        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'Missing GOOGLE_API_KEY in server environment.' }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const body = (await request.json()) as TranslateBody;
        const { text, targetLang } = body;

        if (!text || !targetLang) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: text, targetLang.' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const prompt = `Translate the following user comment to ${targetLang}. Preserve the original tone, emotion, humor, slang, internet language, and emoji exactly. Return ONLY the translated text — no explanations, no quotes, nothing else.\n\n${text}`;

        const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: { temperature: 0.3, maxOutputTokens: 512 },
                }),
            },
        );

        if (!geminiRes.ok) {
            const errText = await geminiRes.text().catch(() => '');
            return new Response(
                JSON.stringify({ error: 'Gemini API request failed.', status: geminiRes.status, details: errText }),
                { status: geminiRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
            );
        }

        const data = (await geminiRes.json()) as any;
        const translated: string =
            data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';

        return new Response(JSON.stringify({ reply: translated }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error?.message || 'Unexpected server error.' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        );
    }
};
