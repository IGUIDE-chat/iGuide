import React from 'react';
import { ChatScreen } from '../../components/ChatScreen';
import { Language } from '../../types';

interface ChatPageProps {
  language: Language;
  currentConversationId: string | null;
  onConversationCreated: (conversationId: string) => void;
}

const ChatPage: React.FC<ChatPageProps> = ({
  language,
  currentConversationId,
  onConversationCreated,
}) => {
  return (
    <ChatScreen
      onNavigateToLibrary={() => {}}
      language={language}
      currentConversationId={currentConversationId}
      onConversationCreated={onConversationCreated}
    />
  );
};

export default ChatPage;
