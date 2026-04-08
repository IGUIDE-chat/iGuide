/**
 * @file ./src/components/chat/ChatRuntimeProvider.tsx
 * @description Chat (AI) Component / Module
 */

import * as React from "react";
import {
	AssistantRuntimeProvider,
	useExternalStoreRuntime,
	type AppendMessage,
	type ThreadMessageLike,
} from "@assistant-ui/react";
import { useChatSession } from "../../pages/chat/useChatSession";
import { type ChatMessage, type Language } from "../../types";

interface ChatRuntimeProviderProps {
	language: Language;
	currentConversationId: string | null;
	onConversationCreated: (id: string) => void;
	children: React.ReactNode;
}

interface ChatSessionContextValue {
	sendMessage: (text: string) => Promise<void>;
}

interface AssistantMessageCustom {
	thinkingSteps: ChatMessage["thinkingSteps"];
	isThinking: ChatMessage["isThinking"];
	followUpQuestions: ChatMessage["followUpQuestions"];
	isStreaming: ChatMessage["isStreaming"];
	[key: string]: unknown;
}

interface MetadataCacheEntry {
	cacheKey: string;
	custom: AssistantMessageCustom;
}

export const ChatSessionContext =
	React.createContext<ChatSessionContextValue | null>(null);

const getTextFromAppendMessage = (message: AppendMessage): string | null => {
	const textPart = message.content.find((part) => part.type === "text");

	if (textPart && textPart.type === "text") {
		return textPart.text;
	}

	return null;
};

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
	});

	const metadataCacheRef = React.useRef<Map<string, MetadataCacheEntry>>(
		new Map(),
	);

	const stableConvertMessage = React.useCallback(
		(msg: ChatMessage): ThreadMessageLike => {
			// Only cache metadata fields — text is always fresh in content array
			const cacheKey = `${msg.thinkingSteps?.length ?? 0}-${msg.followUpQuestions?.length ?? 0}-${msg.isThinking}-${msg.isStreaming}`;
			const cachedEntry = metadataCacheRef.current.get(msg.id);

			let custom: AssistantMessageCustom;
			if (cachedEntry && cachedEntry.cacheKey === cacheKey) {
				custom = cachedEntry.custom; // reuse stable reference
			} else {
				custom = {
					thinkingSteps: msg.thinkingSteps,
					isThinking: msg.isThinking,
					followUpQuestions: msg.followUpQuestions,
					isStreaming: msg.isStreaming,
				};
				metadataCacheRef.current.set(msg.id, { cacheKey, custom });
			}

			return {
				id: msg.id,
				role: msg.role === "model" ? "assistant" : "user",
				content: [{ type: "text", text: msg.text }], // always fresh text
				metadata: {
					custom, // stable custom reference when metadata unchanged
				},
			};
		},
		[],
	);

	const runtime = useExternalStoreRuntime({
		messages,
		convertMessage: stableConvertMessage,
		isRunning: isLoading,
		onNew: async (message: AppendMessage) => {
			const text = getTextFromAppendMessage(message);

			if (text) {
				await sendMessage(text);
			}
		},
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ChatSessionContext.Provider value={{ sendMessage }}>
				{children}
			</ChatSessionContext.Provider>
		</AssistantRuntimeProvider>
	);
};
