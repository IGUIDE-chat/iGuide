import { useCallback, useEffect, useReducer, useRef, useState } from "react"

import { useAuth } from "../../contexts/AuthContext"
import { useThrottle } from "../../hooks/useThrottle"
import { streamChatResponse } from "../../services/ai"
import { conversationService } from "../../services/conversationService"
import { localConversationService } from "../../services/localConversationService"
import { memoryService } from "../../services/memoryService"
import { Language, ChatMessage, MessageSource, ThinkingStep } from "../../types"

interface UseChatSessionOptions {
  language: Language
  currentConversationId: string | null
  onConversationCreated?: (conversationId: string) => void
}

type MessageAction =
  | { type: "SET_MESSAGES"; payload: ChatMessage[] }
  | { type: "ADD_MESSAGE"; payload: ChatMessage }
  | {
      type: "UPDATE_MESSAGE"
      payload: { id: string; updates: Partial<ChatMessage> }
    }
  | { type: "REPLACE_MESSAGE"; payload: ChatMessage }

const messageReducer = (state: ChatMessage[], action: MessageAction): ChatMessage[] => {
  switch (action.type) {
    case "SET_MESSAGES":
      return action.payload
    case "ADD_MESSAGE":
      return [...state, action.payload]
    case "UPDATE_MESSAGE":
      return state.map((msg) =>
        msg.id === action.payload.id ? { ...msg, ...action.payload.updates } : msg,
      )
    case "REPLACE_MESSAGE":
      return state.map((msg) => (msg.id === action.payload.id ? action.payload : msg))
    default:
      return state
  }
}

const NEW_CHAT_TITLE = {
  en: "New Chat",
  zh: "新对话",
} as const

const INVALID_RESPONSE = {
  en: "No response was returned. Please try again.",
  zh: "暂时没有收到回复，请重试。",
} as const

const CONNECTION_ERROR = {
  en: "Connection error. Please try again.",
  zh: "连接失败，请重试。",
} as const

// The 💡 follow-up section header. The prompt specifies the Chinese wording, but
// in English mode the model translates it ("💡 You might also be interested in:").
const FOLLOW_UP_HEADER =
  /\n+[^\n]*💡[^\n]*(?:[你您]可能还想|you (?:might|may) also|related questions|want to know more)[^\n]*(?:\n|$)/i

const LOGGED_IN_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const generateSmartTitle = (text: string, language: Language): string => {
  let title = text.replace(/^(请帮我|帮忙|能否|可以|how to|please|help me)/i, "").trim()

  if (title.includes("?") || title.includes("？")) {
    title = title.split(/[?？]/)[0].trim()
  }

  if (title.length > 30) {
    title = `${title.substring(0, 27)}...`
  }

  return title || NEW_CHAT_TITLE[language]
}

export const useChatSession = ({
  language,
  currentConversationId,
  onConversationCreated,
}: UseChatSessionOptions) => {
  const { user } = useAuth()
  const [messages, dispatch] = useReducer(messageReducer, [])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingHistory, setIsLoadingHistory] = useState(false)
  // Which conversation (per user) the `messages` state currently represents.
  const inMemoryConversationRef = useRef<string | null>(null)
  const conversationKey = useCallback(
    (conversationId: string) => `${user?.id ?? "guest"}:${conversationId}`,
    [user?.id],
  )

  // The reply currently streaming. Cleared before the final message is written,
  // so a throttled update that fires afterwards cannot overwrite it with the raw
  // stream text (which still contains the 💡 follow-up section).
  const streamingMessageIdRef = useRef<string | null>(null)

  const updateMessageText = useCallback((id: string, text: string, steps: ThinkingStep[]) => {
    if (streamingMessageIdRef.current !== id) return
    dispatch({
      type: "UPDATE_MESSAGE",
      payload: {
        id,
        updates: {
          text,
          isThinking: false,
          thinkingSteps: [...steps],
        },
      },
    })
  }, [])

  const throttledUpdateMessageText = useThrottle(updateMessageText, 100)

  const loadConversation = useCallback(
    async (conversationId: string) => {
      setIsLoadingHistory(true)
      try {
        const service = user ? conversationService : localConversationService
        const { data, error } = await service.getConversation(conversationId)
        if (error) {
          throw error
        }

        if (data?.messages) {
          dispatch({
            type: "SET_MESSAGES",
            payload: service.convertToChatMessages(data.messages),
          })
        }
      } catch (error) {
        console.error("Failed to load conversation:", error)
      } finally {
        setIsLoadingHistory(false)
      }
    },
    [user],
  )

  useEffect(() => {
    if (isLoading) {
      console.log("[ChatPage] Skipping loadConversation while streaming")
      return
    }

    if (!currentConversationId) {
      inMemoryConversationRef.current = null
      dispatch({ type: "SET_MESSAGES", payload: [] })
      return
    }

    // State already holds this conversation (we just streamed into it). A reload
    // would swap in stored copies that have new ids and no thinking steps, which
    // makes the finished reply lose its steps and remount.
    if (inMemoryConversationRef.current === conversationKey(currentConversationId)) {
      return
    }

    if (user && !LOGGED_IN_ID_REGEX.test(currentConversationId)) {
      console.warn(
        "[ChatPage] Skipping load of invalid/legacy ID for logged-in user:",
        currentConversationId,
      )
      return
    }

    inMemoryConversationRef.current = conversationKey(currentConversationId)
    void loadConversation(currentConversationId)
  }, [currentConversationId, isLoading, loadConversation, user, conversationKey])

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim() || isLoading) {
        return
      }

      const userMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "user",
        text,
      }

      dispatch({ type: "ADD_MESSAGE", payload: userMsg })
      setInput("")
      setIsLoading(true)

      let conversationId = currentConversationId
      if (!conversationId) {
        try {
          const service = user ? conversationService : localConversationService
          const { data, error } = await service.createConversation(
            undefined,
            generateSmartTitle(text, language),
          )
          if (error) {
            throw error
          }
          if (data) {
            conversationId = data.id
            onConversationCreated?.(data.id)
          }
        } catch (error) {
          console.error("Failed to create conversation:", error)
        }
      }

      if (conversationId) {
        inMemoryConversationRef.current = conversationKey(conversationId)
        try {
          const service = user ? conversationService : localConversationService
          await service.saveMessage(conversationId, userMsg)
        } catch (error) {
          console.error("Failed to save user message:", error)
        }
      }

      try {
        const aiMsgId = crypto.randomUUID()
        streamingMessageIdRef.current = aiMsgId
        const thinkingStartedAt = Date.now()
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: aiMsgId,
            role: "model",
            text: "",
            isStreaming: true,
            isThinking: true,
            thinkingStartedAt,
            thinkingSteps: [
              {
                id: `step-${thinkingStartedAt}-init`,
                type: "processing" as const,
                label: language === "zh" ? "理解问题..." : "Understanding...",
                timestamp: thinkingStartedAt,
                done: false,
              },
            ],
          },
        })

        const stream = await streamChatResponse(
          messages.map((message) => ({
            role: message.role,
            text: message.text,
          })),
          userMsg.text,
          language,
          conversationId || undefined,
          user?.id,
        )

        let fullText = ""
        let followUpQuestions: string[] | undefined
        let thinkingEndedAt: number | undefined
        const thinkingSteps: ThinkingStep[] = []
        // Several searches can return the same page; keep its first position.
        const sources: MessageSource[] = []

        for await (const chunk of stream) {
          if (chunk.source && !sources.some((source) => source.url === chunk.source?.url)) {
            sources.push(chunk.source)
            dispatch({
              type: "UPDATE_MESSAGE",
              payload: { id: aiMsgId, updates: { sources: [...sources] } },
            })
          }

          if (chunk.thinkingStep) {
            if (thinkingSteps.length > 0) {
              thinkingSteps[thinkingSteps.length - 1].done = true
            }
            const step: ThinkingStep = {
              id: `step-${Date.now()}-${thinkingSteps.length}`,
              type: chunk.thinkingStep.type,
              label: chunk.thinkingStep.label,
              detail: chunk.thinkingStep.detail,
              timestamp: Date.now(),
              done: false,
            }
            thinkingSteps.push(step)
            dispatch({
              type: "UPDATE_MESSAGE",
              payload: {
                id: aiMsgId,
                updates: { thinkingSteps: [...thinkingSteps] },
              },
            })
          }

          if (chunk.text) {
            fullText += chunk.text
            if (fullText === chunk.text && thinkingSteps.length > 0) {
              thinkingSteps.forEach((s) => {
                s.done = true
              })
            }
            if (thinkingEndedAt === undefined) {
              // Unthrottled, so the recorded end of thinking is the first token.
              thinkingEndedAt = Date.now()
              dispatch({
                type: "UPDATE_MESSAGE",
                payload: { id: aiMsgId, updates: { thinkingEndedAt } },
              })
            }
            throttledUpdateMessageText(aiMsgId, fullText, thinkingSteps)
          }

          if (chunk.followUpQuestions) {
            followUpQuestions = chunk.followUpQuestions
            dispatch({
              type: "UPDATE_MESSAGE",
              payload: {
                id: aiMsgId,
                updates: { followUpQuestions: chunk.followUpQuestions },
              },
            })
          }
        }

        if (!fullText.trim()) {
          fullText = INVALID_RESPONSE[language]
        }

        const followUpHeaderMatch = fullText.match(FOLLOW_UP_HEADER)
        if (followUpHeaderMatch && (!followUpQuestions || followUpQuestions.length === 0)) {
          const splitIndex = followUpHeaderMatch.index!
          const followUpText = fullText.substring(splitIndex + followUpHeaderMatch[0].length)

          const questions = followUpText
            .split("\n")
            .map((line) =>
              line
                .replace(/^[>\s\d.*[\]-]+/, "")
                .replace(/\]?$/, "")
                .trim(),
            )
            .filter((line) => line.length > 0 && line.length < 150)

          if (questions.length > 0) {
            followUpQuestions = questions
            fullText = fullText.substring(0, splitIndex).trim()
          }
        }

        let userSoulMatch: RegExpMatchArray | null = null
        let userMemoryMatch: RegExpMatchArray | null = null
        let convMemoryMatch: RegExpMatchArray | null = null

        try {
          userSoulMatch = fullText.match(/<user_soul>([\s\S]*?)<\/user_soul>/)
          userMemoryMatch = fullText.match(/<user_memory>([\s\S]*?)<\/user_memory>/)
          convMemoryMatch = fullText.match(/<conv_memory>([\s\S]*?)<\/conv_memory>/)
          fullText = fullText
            .replace(/<user_soul>[\s\S]*?<\/user_soul>/g, "")
            .replace(/<user_memory>[\s\S]*?<\/user_memory>/g, "")
            .replace(/<conv_memory>[\s\S]*?<\/conv_memory>/g, "")
            .trim()
        } catch {
          // Regex failed — skip memory extraction, keep fullText as-is
        }

        // Clean up unclosed/partial tags that would leak into visible text
        fullText = fullText
          .replace(/<user_soul>[\s\S]*/g, "")
          .replace(/<user_memory>[\s\S]*/g, "")
          .replace(/<conv_memory>[\s\S]*/g, "")
          .trim()

        if (!fullText.trim()) {
          fullText = ""
        }

        if (user && (userSoulMatch || userMemoryMatch || convMemoryMatch)) {
          const uid = user.id
          const cid = conversationId
          const soulContent = userSoulMatch?.[1]?.trim()
          if (soulContent) {
            void memoryService.appendSoul(uid, soulContent)
          }
          const userMemContent = userMemoryMatch?.[1]?.trim()
          if (userMemContent) {
            void memoryService.appendUserMemory(uid, userMemContent)
          }
          const convMemContent = convMemoryMatch?.[1]?.trim()
          if (convMemContent && cid) {
            void memoryService.updateConversationMemory(cid, convMemContent)
          }
        }

        thinkingSteps.forEach((s) => {
          s.done = true
        })

        const aiMsg: ChatMessage = {
          id: aiMsgId,
          role: "model",
          text: fullText,
          isStreaming: false,
          isThinking: false,
          followUpQuestions,
          thinkingSteps: thinkingSteps.length > 0 ? thinkingSteps : undefined,
          thinkingStartedAt,
          thinkingEndedAt,
          sources: sources.length > 0 ? sources : undefined,
        }

        streamingMessageIdRef.current = null
        dispatch({ type: "REPLACE_MESSAGE", payload: aiMsg })

        if (conversationId && aiMsg.text.trim()) {
          try {
            const service = user ? conversationService : localConversationService
            await service.saveMessage(conversationId, aiMsg)
          } catch (error) {
            console.error("Failed to save AI message:", error)
          }
        }
      } catch {
        dispatch({
          type: "ADD_MESSAGE",
          payload: {
            id: crypto.randomUUID(),
            role: "model",
            text: CONNECTION_ERROR[language],
          },
        })
      } finally {
        streamingMessageIdRef.current = null
        setIsLoading(false)
      }
    },
    [
      conversationKey,
      currentConversationId,
      isLoading,
      language,
      messages,
      onConversationCreated,
      throttledUpdateMessageText,
      user,
    ],
  )

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      void sendMessage(input)
    },
    [input, sendMessage],
  )

  return {
    messages,
    input,
    isLoading,
    isLoadingHistory,
    setInput,
    sendMessage,
    handleSubmit,
  }
}
