import React from "react"

import { ChatErrorBoundary } from "../../components/chat/ChatErrorBoundary"
import { ChatThread } from "../../components/chat/ChatThread"
import { Language } from "../../types"

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
    <ChatErrorBoundary>
      <ChatThread
        language={language}
        currentConversationId={currentConversationId}
        onConversationCreated={onConversationCreated}
      />
    </ChatErrorBoundary>
  )
}

export default ChatPage
