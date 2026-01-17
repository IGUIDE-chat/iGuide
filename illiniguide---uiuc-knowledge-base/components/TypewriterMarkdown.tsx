import * as React from 'react';
import { useState, useEffect, useRef } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface TypewriterMarkdownProps {
    content: string;
    isStreaming?: boolean;
    speed?: number;
    components?: Components;
}

export const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({
    content,
    isStreaming = false,
    speed = 20,
    components
}) => {
    // 1. NON-STREAMING (Static Content)
    // If not streaming, bypass all complex effect logic and render immediately.
    // This guarantees that history and completed messages NEVER vanish.
    if (!isStreaming) {
        return (
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={components}
            >
                {content}
            </ReactMarkdown>
        );
    }

    // 2. STREAMING (Typewriter Effect)
    // Initialize with empty string for streaming start
    const [displayedContent, setDisplayedContent] = useState('');
    const indexRef = useRef(0);
    const contentRef = useRef(content);

    // Update ref when content changes
    useEffect(() => {
        contentRef.current = content;
    }, [content]);

    // Typewriter animation
    useEffect(() => {
        const intervalId = setInterval(() => {
            const currentContent = contentRef.current;
            const currentIndex = indexRef.current;

            if (currentIndex < currentContent.length) {
                // Determine step size based on how far behind we are
                const distance = currentContent.length - currentIndex;
                let step = 1;

                // Adaptive speed: catch up faster if we're falling behind
                if (distance > 100) step = 5;
                else if (distance > 50) step = 3;
                else if (distance > 20) step = 2;

                const nextIndex = Math.min(currentIndex + step, currentContent.length);
                setDisplayedContent(currentContent.substring(0, nextIndex));
                indexRef.current = nextIndex;
            }
        }, speed);

        return () => clearInterval(intervalId);
    }, [speed]);

    return (
        <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={components}
        >
            {displayedContent}
        </ReactMarkdown>
    );
};
