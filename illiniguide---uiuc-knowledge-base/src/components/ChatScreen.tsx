import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Language, ChatMessage } from '../types';
import { UI_TEXT } from '../i18n/uiText';
import { ChatEmptyState } from './chat/ChatEmptyState';
import { ChatMessageList } from './chat/ChatMessageList';
import { ChatComposer } from './chat/ChatComposer';

interface ChatScreenProps {
  onNavigateToLibrary?: () => void;
  language: Language;
  messages: ChatMessage[];
  input: string;
  isLoading: boolean;
  isLoadingHistory?: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  onSuggestionClick: (text: string) => void;
  onFollowUpClick: (text: string) => void;
}

export const ChatScreen: React.FC<ChatScreenProps> = ({
  language,
  messages,
  input,
  isLoading,
  onInputChange,
  onSubmit,
  onSuggestionClick,
  onFollowUpClick,
}) => {
  const t = UI_TEXT[language];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerClass = 'w-full max-w-3xl mx-auto px-4';

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex flex-col h-full w-full relative">
      <div className="flex-1 overflow-y-auto w-full">
        <div className="flex flex-col min-h-full">
          {messages.length === 0 ? (
            <ChatEmptyState
              language={language}
              title={t.welcomeTitle}
              suggestions={t.suggestions}
              containerClass={containerClass}
              onSuggestionClick={onSuggestionClick}
            />
          ) : (
            <ChatMessageList
              messages={messages}
              isLoading={isLoading}
              containerClass={containerClass}
              botName={t.botName}
              userRole={t.userRole}
              messagesEndRef={messagesEndRef}
              onFollowUpClick={onFollowUpClick}
            />
          )}
        </div>
      </div>

      <ChatComposer
        input={input}
        isLoading={isLoading}
        placeholder={t.inputPlaceholder}
        helperText={t.aiError}
        containerClass={containerClass}
        onInputChange={onInputChange}
        onSubmit={onSubmit}
      />
    </div>
  );
};
