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

const convertContentPart = (
	part: ChatMessage["content"],
): ThreadMessageLike["content"] => {
	if (!part || part.length === 0) return [];

	const content: ThreadMessageLike["content"] = [];

	for (const p of part) {
		if (p.type === "text") {
			content.push({ type: "text", text: p.text || "" });
		} else if (p.type === "reasoning") {
			content.push({ type: "reasoning", text: p.reasoning || "" });
		} else if (p.type === "tool-call" && p.toolCall) {
			content.push({
				type: "tool-call",
				toolCall: {
					toolCallId: `tool-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
					name: p.toolCall.name,
					args: p.toolCall.arguments,
				},
			});
		}
	}

	return content;
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
			const cacheKey = `${msg.followUpQuestions?.length ?? 0}-${msg.isStreaming}`;
			const cachedEntry = metadataCacheRef.current.get(msg.id);

			let custom: AssistantMessageCustom;
			if (cachedEntry && cachedEntry.cacheKey === cacheKey) {
				custom = cachedEntry.custom;
			} else {
				custom = {
					followUpQuestions: msg.followUpQuestions,
					isStreaming: msg.isStreaming,
				};
				metadataCacheRef.current.set(msg.id, { cacheKey, custom });
			}

			return {
				id: msg.id,
				role: msg.role === "model" ? "assistant" : "user",
				content: [
					{ type: "text", text: msg.text },
					...convertContentPart(msg.content),
				],
				metadata: {
					custom,
				},
			};
		},
		[],
	);

	const onNew = React.useCallback(
		async (message: AppendMessage) => {
			const text = getTextFromAppendMessage(message);

			if (text) {
				await sendMessage(text);
			}
		},
		[sendMessage],
	);

	const runtime = useExternalStoreRuntime({
		messages,
		convertMessage: stableConvertMessage,
		isRunning: isLoading,
		onNew,
	});

	return (
		<AssistantRuntimeProvider runtime={runtime}>
			<ChatSessionContext.Provider value={{ sendMessage }}>
				{children}
			</ChatSessionContext.Provider>
		</AssistantRuntimeProvider>
	);
};
