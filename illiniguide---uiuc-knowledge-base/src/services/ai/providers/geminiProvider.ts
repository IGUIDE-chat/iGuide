/**
 * @file ./src/services/ai/providers/geminiProvider.ts
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

﻿import { AIProvider, ChatHistoryItem } from '../types';

// Security: API key is NEVER in the frontend bundle.
// All Gemini calls go through CF Pages Function /api/gemini which injects GOOGLE_API_KEY server-side.
const GEMINI_MODEL = 'gemini-2.5-flash';

interface GeminiResponsePart {
  text?: string;
}

interface GeminiResponseCandidate {
  content?: {
    parts?: GeminiResponsePart[];
  };
}

interface GeminiResponse {
  candidates?: GeminiResponseCandidate[];
}

const buildPrompt = (history: ChatHistoryItem[], newMessage: string) => {
  const historyText = history.map((item) => `${item.role}: ${item.text}`).join('\n');
  return `${historyText}\nuser: ${newMessage}`;
};

const getErrorText = (lang: string | undefined, reason: string) => {
  if (lang === 'zh') {
    return `Gemini 错误: ${reason}`;
  }
  return `Gemini Error: ${reason}`;
};

export const geminiProvider: AIProvider = {
  id: 'gemini',
  streamChatResponse: async function* (history, newMessage, lang) {
    const payload = {
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: buildPrompt(history, newMessage) }] }],
      generationConfig: { temperature: 0.3 },
    };

    try {
      const response = await fetch('/api/gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorBody = await response.text();
        yield { text: getErrorText(lang, `${response.status} ${errorBody}`) };
        return;
      }

      const data: GeminiResponse = await response.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

      if (!text) {
        yield { text: getErrorText(lang, 'No content returned.') };
        return;
      }

      yield { text };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown request failure.';
      yield { text: getErrorText(lang, message) };
    }
  },
};