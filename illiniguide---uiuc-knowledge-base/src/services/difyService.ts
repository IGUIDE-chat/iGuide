/**
 * DIFY API SERVICE
 * Replaces Coze implementation with Dify Cloud API.
 * Supports streaming responses and knowledge base integration.
 */

// ==========================================
// 🛠️ DIFY CONFIGURATION
// ==========================================
const DIFY_API_KEY = import.meta.env.VITE_DIFY_API_KEY || '';
const DIFY_API_BASE = import.meta.env.VITE_DIFY_API_BASE || 'https://api.dify.ai/v1';

export interface StreamResponse {
    text: string;
    followUpQuestions?: string[];
}

interface DifyStreamEvent {
    event: string;
    message_id?: string;
    conversation_id?: string;
    answer?: string;
    metadata?: {
        usage?: any;
        retriever_resources?: any[];
    };
}

/**
 * Stream Chat Response from Dify API
 */
export const streamChatResponse = async function* (
    history: { role: 'user' | 'model'; text: string }[],
    newMessage: string,
    lang: string = 'en',
    conversationId?: string  // Optional Dify conversation ID for context
): AsyncGenerator<StreamResponse> {

    if (!DIFY_API_KEY) {
        yield { text: "Error: Dify API key not configured. Please set VITE_DIFY_API_KEY in your environment." };
        return;
    }

    try {
        // 1. Prepare Request
        // Dify uses 'query' for the user message and maintains conversation context via conversation_id

        // Add language instruction for Chinese
        let finalUserMessage = newMessage;
        if (lang === 'zh') {
            finalUserMessage += " (请务必用中文回答)";
        }

        const requestBody: any = {
            inputs: {},
            query: finalUserMessage,
            response_mode: 'streaming',
            user: 'illini_guest_user', // Anonymous user ID
        };

        // Include conversation_id if provided to maintain context
        if (conversationId) {
            requestBody.conversation_id = conversationId;
        }

        // 2. Call Dify API
        const response = await fetch(`${DIFY_API_BASE}/chat-messages`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${DIFY_API_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Dify API Error:", response.status, errText);
            throw new Error(`Dify API returned ${response.status}: ${errText}`);
        }

        if (!response.body) throw new Error("No response body");

        // 3. Process Stream
        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = '';
        let followUpQuestions: string[] = [];
        let newConversationId: string | undefined;

        console.log('[Dify] Starting to read stream...');

        while (true) {
            const { done, value } = await reader.read();
            if (done) {
                console.log('[Dify] Stream completed');
                break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');

            // Keep the last incomplete line in the buffer
            buffer = lines.pop() || '';

            for (const line of lines) {
                const trimmedLine = line.trim();
                if (!trimmedLine || !trimmedLine.startsWith('data: ')) continue;

                try {
                    const jsonStr = trimmedLine.substring(6).trim();
                    if (!jsonStr) continue;

                    const data: DifyStreamEvent = JSON.parse(jsonStr);
                    console.log('[Dify] Event:', data.event);

                    // Handle different Dify event types
                    switch (data.event) {
                        case 'message':
                        case 'agent_message':
                            // Incremental answer chunks
                            if (data.answer) {
                                yield { text: data.answer };
                            }
                            break;

                        case 'message_end':
                            // Message completed, may contain metadata
                            console.log('[Dify] Message completed');

                            // Store conversation_id for future requests
                            if (data.conversation_id) {
                                newConversationId = data.conversation_id;
                                // You can store this in localStorage or state management
                                if (typeof localStorage !== 'undefined') {
                                    localStorage.setItem('dify_conversation_id', data.conversation_id);
                                }
                            }

                            // Extract suggested questions if available
                            // Note: Dify's suggested questions format may vary
                            // Adjust based on actual API response
                            if (data.metadata) {
                                const metadata = data.metadata as any;
                                if (metadata.suggested_questions && Array.isArray(metadata.suggested_questions)) {
                                    followUpQuestions = metadata.suggested_questions;
                                    console.log('[Dify] Found suggested questions:', followUpQuestions);
                                }
                            }
                            break;

                        case 'message_replace':
                            // Full message replacement (rare)
                            if (data.answer) {
                                yield { text: data.answer };
                            }
                            break;

                        case 'error':
                            console.error('[Dify] Error event:', data);
                            yield { text: "\n[Error: Chat failed]" };
                            break;

                        case 'ping':
                            // Keep-alive ping, ignore
                            break;

                        default:
                            console.log('[Dify] Unknown event type:', data.event);
                    }

                } catch (e) {
                    console.warn('[Dify] Failed to parse line:', trimmedLine, e);
                }
            }
        }

        // Yield follow-up questions at the end if available
        if (followUpQuestions.length > 0) {
            console.log('[Dify] Yielding', followUpQuestions.length, 'follow-up questions');
            yield { text: '', followUpQuestions };
        }

    } catch (error: any) {
        console.error("Dify Stream Error:", error);
        // User-friendly error message
        yield { text: `\n(Connection Error: ${error.message || 'Failed to reach Dify API'}. Please check your API key and network connection.)` };
    }
};

/**
 * Helper function to get or create conversation ID
 * This maintains conversation context across multiple messages
 */
export function getConversationId(): string | undefined {
    if (typeof localStorage !== 'undefined') {
        return localStorage.getItem('dify_conversation_id') || undefined;
    }
    return undefined;
}

/**
 * Helper function to clear conversation context
 * Call this when starting a new conversation
 */
export function clearConversationId(): void {
    if (typeof localStorage !== 'undefined') {
        localStorage.removeItem('dify_conversation_id');
    }
}
