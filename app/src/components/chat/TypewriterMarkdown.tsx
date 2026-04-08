/**
 * @file ./src/components/chat/TypewriterMarkdown.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import * as React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";

interface TypewriterMarkdownProps {
	content: string;
	isStreaming?: boolean;
	speed?: number;
	components?: Components;
}

const remarkPlugins = [remarkGfm];

/**
 * Memoised block for content that has already been fully streamed.
 * Only re-renders when `content` string actually changes.
 */
const StableMarkdown = React.memo(
	({ content, components }: { content: string; components?: Components }) => (
		<ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
			{content}
		</ReactMarkdown>
	),
);
StableMarkdown.displayName = "StableMarkdown";

/**
 * Find the last "safe split" point — the end of a complete markdown paragraph
 * (double newline) so the stable prefix is always valid markdown.
 */
function splitAtLastParagraph(text: string): [string, string] {
	// Need at least some content in both halves to be worth splitting
	if (text.length < 120) return ["", text];

	const lastBreak = text.lastIndexOf("\n\n");
	if (lastBreak <= 0) return ["", text];

	return [text.slice(0, lastBreak), text.slice(lastBreak)];
}

const TypewriterMarkdownInner: React.FC<TypewriterMarkdownProps> = ({
	content,
	isStreaming = false,
	components,
}) => {
	if (!isStreaming) {
		return <StableMarkdown content={content || ""} components={components} />;
	}

	// During streaming: split into stable prefix (memoised) + active tail
	const [stableContent, tailContent] = splitAtLastParagraph(content || "");

	return (
		<>
			{/* Always render StableMarkdown so aui-streaming-tail stays at
			    position 1 in the fragment — prevents unmount/remount when
			    stableContent first becomes non-empty, which would re-trigger
			    the stream-in CSS animation. */}
			<StableMarkdown content={stableContent || ""} components={components} />
			<div className="aui-streaming-tail">
				<ReactMarkdown remarkPlugins={remarkPlugins} components={components}>
					{tailContent}
				</ReactMarkdown>
			</div>
		</>
	);
};

export const TypewriterMarkdown = React.memo(TypewriterMarkdownInner);
TypewriterMarkdown.displayName = "TypewriterMarkdown";
