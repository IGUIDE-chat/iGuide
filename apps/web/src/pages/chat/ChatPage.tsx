import React from "react"

import { ChatRuntimeProvider } from "../../components/chat/ChatRuntimeProvider"
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
