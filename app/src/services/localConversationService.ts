/**
 * @file ./src/services/localConversationService.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [SERVICE] Manages local storage for guest mode conversations.
// [服务] 管理访客模式下的本地会话存储。
import { ChatMessage } from "../types";

const STORAGE_KEY = "guest_conversations";

interface LocalMessage {
  id: string;
  conversation_id: string;
  role: "user" | "model";
  content: string;
  created_at: string;
  follow_up_questions?: string[];
}

interface LocalConversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  is_pinned: boolean;
  messages: LocalMessage[];
}

const getStorage = (): Record<string, LocalConversation> => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (e) {
    console.error("Failed to parse local storage", e);
    return {};
  }
};

const setStorage = (data: Record<string, LocalConversation>) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to write to local storage", e);
  }
};

export const localConversationService = {
  async createConversation(
    cozeConversationId?: string,
    title: string = "New Chat"
  ) {
    const conversations = getStorage();
    // Use crypto.randomUUID for compatibility (safely falls back if needed, but modern browsers support it)
    const id = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
    const now = new Date().toISOString();

    const newConv: LocalConversation = {
      id,
      title,
      created_at: now,
      updated_at: now,
      is_pinned: false,
      messages: [],
    };

    conversations[id] = newConv;
    setStorage(conversations);

    return { data: newConv, error: null };
  },

  async getUserConversations() {
    const conversations = getStorage();
    const list = Object.values(conversations).sort((a, b) => {
      if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
      return (
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    });

    // Map to format matching Supabase response
    const data = list.map((c) => ({
      id: c.id,
      title: c.title,
      is_pinned: c.is_pinned,
      created_at: c.created_at,
      updated_at: c.updated_at,
      messages: c.messages,
    }));

    return { data, error: null };
  },

  async getConversation(conversationId: string) {
    const conversations = getStorage();
    const conv = conversations[conversationId];

    if (!conv) {
      return { data: null, error: new Error("Conversation not found") };
    }

    return {
      data: { conversation: conv, messages: conv.messages },
      error: null,
    };
  },

  async saveMessage(conversationId: string, message: ChatMessage) {
    const conversations = getStorage();
    const conv = conversations[conversationId];

    if (!conv) {
      return { data: null, error: new Error("Conversation not found") };
    }

    const newMessage: LocalMessage = {
      id: Date.now().toString(),
      conversation_id: conversationId,
      role: message.role,
      content: message.text,
      created_at: new Date().toISOString(),
      follow_up_questions: message.followUpQuestions,
    };

    conv.messages.push(newMessage);
    conv.updated_at = new Date().toISOString();

    conversations[conversationId] = conv;
    setStorage(conversations);

    return { data: newMessage, error: null };
  },

  /**
   * Replace all messages in a guest conversation (regenerate / edit-and-resend).
   */
  async overwriteMessages(conversationId: string, messages: ChatMessage[]) {
    const conversations = getStorage();
    const conv = conversations[conversationId];

    if (!conv) {
      return { error: new Error("Conversation not found") };
    }

    const now = Date.now();
    conv.messages = messages.map((message, index) => ({
      id: `${now + index}`,
      conversation_id: conversationId,
      role: message.role,
      content: message.text,
      created_at: new Date(now + index).toISOString(),
      follow_up_questions: message.followUpQuestions,
    }));
    conv.updated_at = new Date().toISOString();

    conversations[conversationId] = conv;
    setStorage(conversations);

    return { error: null };
  },

  async updateConversationTitle(conversationId: string, title: string) {
    const conversations = getStorage();
    if (conversations[conversationId]) {
      conversations[conversationId].title = title;
      setStorage(conversations);
      return { data: conversations[conversationId], error: null };
    }
    return { data: null, error: new Error("Conversation not found") };
  },

  async deleteConversation(conversationId: string) {
    const conversations = getStorage();
    if (conversations[conversationId]) {
      delete conversations[conversationId];
      setStorage(conversations);
    }
    return { error: null };
  },

  async togglePinConversation(conversationId: string, isPinned: boolean) {
    const conversations = getStorage();
    if (conversations[conversationId]) {
      conversations[conversationId].is_pinned = isPinned;
      setStorage(conversations);
      return { data: conversations[conversationId], error: null };
    }
    return { data: null, error: new Error("Conversation not found") };
  },

  convertToChatMessages(messages: LocalMessage[]): ChatMessage[] {
    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role,
      text: msg.content,
      followUpQuestions: msg.follow_up_questions,
    }));
  },
};
