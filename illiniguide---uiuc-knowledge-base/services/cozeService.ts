/**
 * COZE API SERVICE
 * Replaces previous Gemini/Local implementations.
 * Focuses strictly on calling the Coze V3 Chat API.
 */

// ==========================================
// 🛠️ COZE CONFIGURATION
// ==========================================
const COZE_API_KEY = import.meta.env.VITE_COZE_API_KEY;
const COZE_BOT_ID = import.meta.env.VITE_COZE_BOT_ID;
const COZE_API_URL = "https://api.coze.com/v3/chat";
const COZE_CONVERSATION_API_URL = "https://api.coze.com/v1/conversation/create";

export interface StreamResponse {
  text: string;
  followUpQuestions?: string[];
}

/**
 * Stream Chat Response from Coze API
 */
export const streamChatResponse = async function* (
  history: { role: 'user' | 'model'; text: string }[],
  newMessage: string,
  lang: string = 'en',
  conversationId?: string,  // Optional Coze conversation ID
  userId?: string           // Optional: Pass Supabase User ID or Guest ID
): AsyncGenerator<StreamResponse> {

  // In DEV mode, we need the keys to call Coze directly.
  // In PROD mode, we use a backend proxy, so the client doesn't need the keys.
  if (import.meta.env.DEV && (!COZE_API_KEY || !COZE_BOT_ID)) {
    yield { text: "Error: Coze configuration missing in .env.local (Dev Mode)." };
    return;
  }

  // 0. Determine Coze User ID (Isolation)
  // If we have a logged-in userId, use it.
  // If not, use (or generate) a persistent Guest UUID from localStorage.
  let cozeUserId = userId;
  if (!cozeUserId) {
    const STORAGE_KEY = 'illini_guest_device_id';
    let guestId = localStorage.getItem(STORAGE_KEY);
    if (!guestId) {
      // Simple random ID generator (sufficient for guest isolation)
      guestId = 'guest_' + Math.random().toString(36).substring(2, 15);
      localStorage.setItem(STORAGE_KEY, guestId);
    }
    cozeUserId = guestId;
  }

  console.log('[Coze] Using UserID:', cozeUserId);

  try {
    // 1. Prepare Request
    // We map 'model' role to 'assistant' for Coze API compatibility

    // If language is Chinese, we append a strict instruction to the latest message
    // This ensures the bot speaks Chinese even if the user asks in English or uses English terms.
    let finalUserMessage = newMessage;
    if (lang === 'zh') {
      finalUserMessage += " (请务必用中文回答)";
    } else if (lang === 'en') {
      // ENHANCED PROMPT: Force detailed translation instead of summary
      // The bot tends to give shorter responses in English, so we explicitly instruct it to be comprehensive
      finalUserMessage += " (Please answer ONLY in English. You MUST provide a comprehensive, extremely detailed response. Translate ALL relevant information from the Knowledge Base step-by-step. Do NOT summarize or shorten the content. Match the length and depth of a native Chinese response.)";
    }

    // OPTIMIZATION: Do not send full history if auto_save_history is enabled.
    // Sending full history causes duplication (Server Context + Client Sent History).
    // We only send the NEWEST message.
    const messages = [
      { role: 'user', content: finalUserMessage, content_type: 'text' }
    ];

    // 2. Call Coze API
    let response;

    // HYBRID MODE:
    // Local Dev: Call Coze directly (requires VITE_COZE_API_KEY in .env.local)
    // Production: Call Cloudflare Backend Proxy (secure, handles CORS & Secrets)
    if (import.meta.env.DEV) {
      console.log('[Dev] Using proxy Coze API call');
      // Use local proxy path defined in vite.config.ts to avoid CORS
      response = await fetch('/api/coze/v3/chat', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COZE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          bot_id: COZE_BOT_ID,
          user_id: cozeUserId,
          stream: true,
          auto_save_history: true,
          additional_messages: messages,
          custom_variables: {
            language: lang === 'zh' ? 'Chinese' : 'English',
            response_detail_level: 'comprehensive'
          },
          ...(conversationId && { conversation_id: conversationId })
        })
      });
    } else {
      // Production: Use Proxy
      response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: finalUserMessage,
          history: history,
          conversationId: conversationId,
          userId: cozeUserId,
          lang: lang  // Pass language to backend for custom_variables
        })
      });
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error("Coze API Error:", response.status, errText);
      throw new Error(`Coze API returned ${response.status}: ${errText}`);
    }

    if (!response.body) throw new Error("No response body");

    // 3. Process Stream
    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = '';
    let currentEvent = '';
    let followUpQuestions: string[] = [];

    console.log('[Coze] Starting to read stream...');

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('[Coze] Stream completed');
        break;
      }

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in the buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmedLine = line.trim();
        if (!trimmedLine) continue;

        // SSE format: "event: <event_type>" followed by "data: <json>"
        if (trimmedLine.startsWith('event:')) {
          currentEvent = trimmedLine.substring(6).trim();
          continue;
        }

        // NEW: Handle raw JSON responses (e.g. error messages or non-stream responses)
        if (trimmedLine.startsWith('{')) {
          try {
            const jsonBody = JSON.parse(trimmedLine);
            if (jsonBody.code && jsonBody.code !== 0) {
              console.error("Coze API Error (JSON):", jsonBody);
              yield { text: `\n(API Error: ${jsonBody.msg || 'Unknown error'} - Code: ${jsonBody.code})` };
              return;
            }
            console.log("[Coze] Received raw JSON:", jsonBody);
          } catch (e) { }
          continue;
        }

        if (trimmedLine.startsWith('data:')) {
          try {
            const jsonStr = trimmedLine.substring(5).trim();
            if (!jsonStr || jsonStr === '"[DONE]"') {
              console.log('[Coze] Received [DONE] signal');
              continue;
            }

            const data = JSON.parse(jsonStr);
            console.log('[Coze] Event:', currentEvent, 'Type:', data.type);

            // Handle Coze V3 message types
            if (currentEvent === 'conversation.message.delta' && data.type === 'answer') {
              if (data.content) {
                yield { text: data.content };
              }
            }
            else if (currentEvent === 'conversation.message.completed' && data.type === 'answer') {
              console.log('[Coze] Message completed, content length:', data.content?.length || 0);
            }
            else if (currentEvent === 'conversation.message.completed' && data.type === 'follow_up') {
              if (data.content) {
                followUpQuestions.push(data.content);
                console.log('[Coze] Follow-up question collected:', data.content);
              }
            }
            else if (currentEvent === 'conversation.chat.completed') {
              console.log('[Coze] Chat completed successfully');
              if (followUpQuestions.length > 0) {
                console.log('[Coze] Yielding', followUpQuestions.length, 'follow-up questions');
                yield { text: '', followUpQuestions };
              }
            }
            else if (currentEvent === 'conversation.chat.failed') {
              console.error('[Coze] Chat failed:', data);
              yield { text: `\n[Error: Chat failed - ${data.msg || JSON.stringify(data)}]` };
            }

          } catch (e) {
            console.warn('[Coze] Failed to parse data line:', trimmedLine, e);
          }
        }
      }
    }

  } catch (error: any) {
    console.error("Stream Error:", error);
    yield { text: `\n(Connection Error: ${error.message || 'Failed to reach Coze API'}. Please check your internet or CORS settings.)` };
  }
};