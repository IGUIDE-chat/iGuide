/**
 * @file ./src/pages/chat/ChatPage.tsx
 * @description Page Route Component / Module
 * @description_zh 这是一个页面级路由编排器（Orchestrator）。只负责读取 URL 参数和组装 Feature Components。不要在这里写超过 300 行的 UI 逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react"

import { ChatRuntimeProvider } from "../../components/chat/ChatRuntimeProvider"
import { ChatThread } from "../../components/chat/ChatThread"
import { type Language } from "../../types"

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
  return (
    <ChatRuntimeProvider
      language={language}
      currentConversationId={currentConversationId}
      onConversationCreated={onConversationCreated}
    >
      <ChatThread language={language} />
    </ChatRuntimeProvider>
  )
}

export default ChatPage
