/**
 * COZE API SERVICE
 * Replaces previous Gemini/Local implementations.
 * Focuses strictly on calling the Coze V3 Chat API.
 */

// ==========================================
// 🛠️ COZE CONFIGURATION
// ==========================================
const COZE_API_KEY = import.meta.env.VITE_COZE_API_KEY || 'pat_kAgnKZqdzDca2GDBBNdkr14QEpkz0MtFNapT6Vee17mGepbblkzk49tTpWcBxRVq';
const COZE_BOT_ID = import.meta.env.VITE_COZE_BOT_ID || '7595237753500827653';
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
  conversationId?: string  // Optional Coze conversation ID
): AsyncGenerator<StreamResponse> {

  if (!COZE_API_KEY || !COZE_BOT_ID) {
    yield { text: "Error: Coze configuration missing." };
    return;
  }

  try {
    // 1. Prepare Request
    // We map 'model' role to 'assistant' for Coze API compatibility

    // If language is Chinese, we append a strict instruction to the latest message
    // This ensures the bot speaks Chinese even if the user asks in English or uses English terms.
    let finalUserMessage = newMessage;
    if (lang === 'zh') {
      finalUserMessage += " (请务必用中文回答)";
    } else if (lang === 'en') {
      finalUserMessage = "Please answer in English. Provide a detailed, helpful, and comprehensive response: " + finalUserMessage;
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
          user_id: 'illini_guest_user',
          stream: true,
          auto_save_history: true,
          additional_messages: messages,
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
          conversationId: conversationId
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
            // We only care about 'answer' type messages for the main response
            if (currentEvent === 'conversation.message.delta' && data.type === 'answer') {
              // Delta events contain incremental content
              if (data.content) {
                yield { text: data.content };
              }
            }
            else if (currentEvent === 'conversation.message.completed' && data.type === 'answer') {
              // Sometimes the full message comes in completed event
              console.log('[Coze] Message completed, content length:', data.content?.length || 0);
            }
            else if (currentEvent === 'conversation.message.completed' && data.type === 'follow_up') {
              // Collect follow-up questions
              if (data.content) {
                followUpQuestions.push(data.content);
                console.log('[Coze] Follow-up question collected:', data.content);
              }
            }
            else if (currentEvent === 'conversation.chat.completed') {
              console.log('[Coze] Chat completed successfully');
              // Yield follow-up questions at the end
              if (followUpQuestions.length > 0) {
                console.log('[Coze] Yielding', followUpQuestions.length, 'follow-up questions');
                yield { text: '', followUpQuestions };
              }
            }
            else if (currentEvent === 'conversation.chat.failed') {
              console.error('[Coze] Chat failed:', data);
              yield { text: "\n[Error: Chat failed]" };
            }

          } catch (e) {
            console.warn('[Coze] Failed to parse line:', trimmedLine, e);
          }
        }
      }
    }

  } catch (error: any) {
    console.error("Stream Error:", error);
    // User-friendly error message
    yield { text: `\n(Connection Error: ${error.message || 'Failed to reach Coze API'}. Please check your internet or CORS settings.)` };
  }
};