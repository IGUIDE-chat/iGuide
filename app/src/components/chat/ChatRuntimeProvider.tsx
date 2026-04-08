/**
 * @file ./src/components/chat/ChatRuntimeProvider.tsx
 * @description Chat (AI) Component / Module
 */

import * as React from 'react'
import {
  AssistantRuntimeProvider,
  useExternalStoreRuntime,
  type AppendMessage,
  type ThreadMessageLike,
} from '@assistant-ui/react'
import { useChatSession } from '../../pages/chat/useChatSession'
import { type ChatMessage, type Language } from '../../types'

interface ChatRuntimeProviderProps {
  language: Language
  currentConversationId: string | null
  onConversationCreated: (id: string) => void
  children: React.ReactNode
}

interface ChatSessionContextValue {
  sendMessage: (text: string) => Promise<void>
}

export const ChatSessionContext =
  React.createContext<ChatSessionContextValue | null>(null)

const convertMessage = (msg: ChatMessage): ThreadMessageLike => {
  return {
    id: msg.id,
    role: msg.role === 'model' ? 'assistant' : 'user',
    content: [{ type: 'text', text: msg.text }],
    metadata: {
      custom: {
        thinkingSteps: msg.thinkingSteps,
        isThinking: msg.isThinking,
        followUpQuestions: msg.followUpQuestions,
        isStreaming: msg.isStreaming,
      },
    },
  }
}

const getTextFromAppendMessage = (message: AppendMessage): string | null => {
  const textPart = message.content.find((part) => part.type === 'text')

  if (textPart && textPart.type === 'text') {
    return textPart.text
  }

  return null
}

export const ChatRuntimeProvider = ({
  language,
  currentConversationId,
  onConversationCreated,
  children,
}: ChatRuntimeProviderProps) => {
  const { messages, isLoading, sendMessage } = useChatSession({
    language,
    currentConversationId,
    onConversationCreated,
  })

  const runtime = useExternalStoreRuntime({
    messages,
    convertMessage,
    isRunning: isLoading,
    onNew: async (message: AppendMessage) => {
      const text = getTextFromAppendMessage(message)

      if (text) {
        await sendMessage(text)
      }
    },
  })

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatSessionContext.Provider value={{ sendMessage }}>
        {children}
      </ChatSessionContext.Provider>
    </AssistantRuntimeProvider>
  )
}
