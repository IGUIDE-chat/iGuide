/**
 * @file ./src/pages/chat/ChatPage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react'
import { ChatScreen } from '../../components/chat/ChatScreen'
import { Language } from '../../types'
import { useChatSession } from './useChatSession'

interface ChatPageProps {
  language: Language
  currentConversationId: string | null
  onConversationCreated: (conversationId: string) => void
}

const ChatPage: React.FC<ChatPageProps> = ({
  language,
  currentConversationId,
  onConversationCreated,
}) => {
  const { messages, input, isLoading, setInput, sendMessage, handleSubmit } =
    useChatSession({
      language,
      currentConversationId,
      onConversationCreated,
    })

  return (
    <ChatScreen
      language={language}
      messages={messages}
      input={input}
      isLoading={isLoading}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      onSuggestionClick={(text) => {
        void sendMessage(text)
      }}
      onFollowUpClick={(text) => {
        void sendMessage(text)
      }}
    />
  )
}

export default ChatPage
