/**
 * @file ./src/components/chat/ChatScreen.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { Language, ChatMessage } from '../../types';
import { UI_TEXT } from '../../i18n/uiText';
import { ChatEmptyState } from './ChatEmptyState';
import { ChatMessageList } from './ChatMessageList';
import { ChatComposer } from './ChatComposer';

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
  onStop?: () => void;
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
  onStop,
}) => {
  const t = UI_TEXT[language];
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const previousMessagesLength = useRef(0);
  const containerClass = 'w-full max-w-3xl mx-auto px-4';

  useEffect(() => {
    if (messages.length > previousMessagesLength.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    previousMessagesLength.current = messages.length;
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
        onStop={onStop}
      />
    </div>
  );
};
