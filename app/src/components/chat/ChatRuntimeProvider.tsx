/**
 * @file ./src/components/chat/ChatRuntimeProvider.tsx
 * @description Chat runtime provider — wraps useChat from @ai-sdk/react and
 *   exposes a stable ChatSessionContext for child components.
 */

import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport, type UIMessage } from "ai"
import * as React from "react"

import { useAuth } from "../../contexts/AuthContext"
import { conversationService } from "../../services/conversationService"
import { localConversationService } from "../../services/localConversationService"
import { memoryService } from "../../services/memoryService"
import { supabase } from "../../services/supabase"
import { ChatErrorBoundary } from "./ChatErrorBoundary"
import { extractFollowUps } from "./followUpExtraction"
import { extractMemoryTags } from "./memoryTagExtraction"
import { chatMessagesToUIMessages } from "./messageAdapters"

interface ChatSessionContextValue {
  messages: UIMessage[]
  input: string
  setInput: (v: string) => void
  handleSubmit: (e?: React.FormEvent) => void
  append: (text: string) => void
  /** @deprecated Transitional alias for `append`; removed in T13 once ChatThread is migrated. */
  appendMessage: (text: string) => void
  stop: () => void
  isLoading: boolean
  error?: Error
  followUps: string[] | null
  editAndRegenerate: (messageId: string, newText: string) => Promise<void>
}

export const ChatSessionContext =
  React.createContext<ChatSessionContextValue | null>(null)

interface ChatRuntimeProviderProps {
  language: string
  currentConversationId: string | null
  onConversationCreated: (id: string) => void
  children: React.ReactNode
}

export const ChatRuntimeProvider = ({
  language,
  currentConversationId,
  onConversationCreated,
  children,
}: ChatRuntimeProviderProps) => {
  const { user } = useAuth()
  const service = user ? conversationService : localConversationService

  const [input, setInput] = React.useState("")
  const [followUps, setFollowUps] = React.useState<string[] | null>(null)
  const [initialMessages, setInitialMessages] = React.useState<
    UIMessage[] | undefined
  >()

  const conversationIdRef = React.useRef(currentConversationId)
  conversationIdRef.current = currentConversationId

  const languageRef = React.useRef(language)
  languageRef.current = language

  // Hydrate prior conversation messages
  React.useEffect(() => {
    if (!currentConversationId) {
      setInitialMessages([])
      return
    }
    let cancelled = false
    void (async () => {
      const { data } = await service.getConversation(currentConversationId)
      if (cancelled) {
        return
      }
      if (data?.messages) {
        const chatMessages = service.convertToChatMessages(
          data.messages as never
        )
        setInitialMessages(chatMessagesToUIMessages(chatMessages))
      } else {
        setInitialMessages([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [currentConversationId, service])

  const apiUrl = import.meta.env.VITE_API_GATEWAY_URL
    ? `${import.meta.env.VITE_API_GATEWAY_URL}/chat`
    : "/chat"

  const transport = React.useMemo(
    () =>
      new DefaultChatTransport({
        api: apiUrl,
        body: () => ({
          conversationId: conversationIdRef.current,
          lang: languageRef.current,
        }),
        headers: async (): Promise<Record<string, string>> => {
          const {
            data: { session },
          } = await supabase.auth.getSession()
          return session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {}
        },
      }),
    [apiUrl]
  )

  const chat = useChat({
    transport,
    messages: initialMessages,
    onFinish: ({ message }) => {
      const text =
        message.parts
          ?.filter(
            (p): p is { type: "text"; text: string } => p.type === "text"
          )
          .map((p) => p.text)
          .join("") ?? ""

      const memoryTags = extractMemoryTags(text)
      if (
        user &&
        (memoryTags.userSoul || memoryTags.userMemory || memoryTags.convMemory)
      ) {
        if (memoryTags.userSoul) {
          void memoryService.appendSoul(user.id, memoryTags.userSoul)
        }
        if (memoryTags.userMemory) {
          void memoryService.appendUserMemory(user.id, memoryTags.userMemory)
        }
        if (memoryTags.convMemory && conversationIdRef.current) {
          void memoryService.updateConversationMemory(
            conversationIdRef.current,
            memoryTags.convMemory
          )
        }
      }

      const fu = extractFollowUps(text)
      if (fu) {
        setFollowUps(fu)
      }
    },
    onError: (err) => {
      console.error("[useChat]", err)
    },
  })

  const isLoading = chat.status === "submitted" || chat.status === "streaming"

  // Lazy-create conversation on first append
  const append = React.useCallback(
    async (text: string) => {
      if (!conversationIdRef.current) {
        const { data } = await service.createConversation(
          undefined,
          text.slice(0, 30)
        )
        if (data) {
          conversationIdRef.current = data.id
          onConversationCreated(data.id)
        }
      }
      await chat.sendMessage({ text })
    },
    [chat, onConversationCreated, service]
  )

  const handleSubmit = React.useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault()
      if (!input.trim() || isLoading) {
        return
      }
      void append(input)
      setInput("")
    },
    [input, isLoading, append]
  )

  const editAndRegenerate = React.useCallback(
    async (messageId: string, newText: string) => {
      const idx = chat.messages.findIndex((m) => m.id === messageId)
      if (idx === -1) {
        return
      }
      const msg = chat.messages[idx]
      if (msg.role !== "user") {
        return
      }

      const edited: UIMessage = {
        ...msg,
        parts: [{ type: "text" as const, text: newText }],
      }
      const truncated = chat.messages.slice(0, idx + 1)
      truncated[truncated.length - 1] = edited
      chat.setMessages(truncated)
      setFollowUps(null)

      if (conversationIdRef.current) {
        const editFn = (
          service as {
            editMessage?: (
              cid: string,
              mid: string,
              text: string
            ) => Promise<{ data?: { created_at?: string } | null }>
          }
        ).editMessage
        const deleteAfterFn = (
          service as {
            deleteMessagesAfter?: (
              cid: string,
              afterIso: string
            ) => Promise<unknown>
          }
        ).deleteMessagesAfter

        let pivotIso: string | undefined
        if (editFn) {
          const result = await editFn(
            conversationIdRef.current,
            messageId,
            newText
          )
          pivotIso = result?.data?.created_at ?? undefined
        }
        if (deleteAfterFn && pivotIso) {
          await deleteAfterFn(conversationIdRef.current, pivotIso)
        }
      }

      await chat.regenerate()
    },
    [chat, service]
  )

  const ctxValue = React.useMemo<ChatSessionContextValue>(() => {
    const appendFn = (t: string) => void append(t)
    return {
      messages: chat.messages,
      input,
      setInput,
      handleSubmit,
      append: appendFn,
      appendMessage: appendFn,
      stop: chat.stop,
      isLoading,
      error: chat.error,
      followUps,
      editAndRegenerate,
    }
  }, [
    chat.messages,
    chat.stop,
    chat.error,
    input,
    handleSubmit,
    append,
    isLoading,
    followUps,
    editAndRegenerate,
  ])

  return (
    <ChatErrorBoundary>
      <ChatSessionContext.Provider value={ctxValue}>
        {children}
      </ChatSessionContext.Provider>
    </ChatErrorBoundary>
  )
}
