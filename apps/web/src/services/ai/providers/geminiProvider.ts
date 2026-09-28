import { AIProvider, ChatHistoryItem } from "../types"

const GEMINI_MODEL = "gemini-1.5-flash"

interface GeminiResponsePart {
  text?: string
}

interface GeminiResponseCandidate {
  content?: {
    parts?: GeminiResponsePart[]
  }
}

interface GeminiResponse {
  candidates?: GeminiResponseCandidate[]
}

const buildPrompt = (history: ChatHistoryItem[], newMessage: string) => {
  const historyText = history.map((item) => `${item.role}: ${item.text}`).join("\n")
  return `${historyText}\nuser: ${newMessage}`
}

const getErrorText = (lang: string | undefined, reason: string) => {
  if (lang === "zh") {
    return `Gemini 错误: ${reason}`
  }
  return `Gemini Error: ${reason}`
}

export const geminiProvider: AIProvider = {
  id: "gemini",
  streamChatResponse: async function* (history, newMessage, lang) {
    const payload = {
      model: GEMINI_MODEL,
      contents: [{ parts: [{ text: buildPrompt(history, newMessage) }] }],
      generationConfig: { temperature: 0.3 },
    }

    try {
      const response = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const errorBody = await response.text()
        yield { text: getErrorText(lang, `${response.status} ${errorBody}`) }
        return
      }

      const data: GeminiResponse = await response.json()
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

      if (!text) {
        yield { text: getErrorText(lang, "No content returned.") }
        return
      }

      yield { text }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown request failure."
      yield { text: getErrorText(lang, message) }
    }
  },
}
