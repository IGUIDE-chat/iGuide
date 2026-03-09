import React from 'react';
import { ChatScreen } from '../../components/ChatScreen';
import { Language } from '../../types';
import { useChatSession } from './useChatSession';

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
  const { messages, input, isLoading, setInput, sendMessage, handleSubmit } =
    useChatSession({
      language,
      currentConversationId,
      onConversationCreated,
    });

  return (
    <ChatScreen
      language={language}
      messages={messages}
      input={input}
      isLoading={isLoading}
      onInputChange={setInput}
      onSubmit={handleSubmit}
      onSuggestionClick={(text) => {
        void sendMessage(text);
      }}
      onFollowUpClick={(text) => {
        void sendMessage(text);
      }}
    />
  );
};

export default ChatPage;
