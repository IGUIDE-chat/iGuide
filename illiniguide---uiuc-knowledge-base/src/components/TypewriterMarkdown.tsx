import * as React from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterMarkdownProps {
    content: string;
    isStreaming?: boolean;
    speed?: number;
    components?: Components;
}

// SIMPLIFIED: No typewriter effect, just direct render
export const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({
    content,
    isStreaming = false,
    components
}) => {
    console.log(`[Typewriter] Render: isStreaming=${isStreaming}, contentLen=${content?.length}`);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
        >
            {content || ''}
        </ReactMarkdown>
    );
};
