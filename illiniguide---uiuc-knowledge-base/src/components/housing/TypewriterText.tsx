/**
 * @file ./src/components/housing/TypewriterText.tsx
 * @description Housing (Dorms) Component / Module
 * @description_zh 此文件属于 Housing 业务域（限界上下文）。请勿在此引入其他业务（如 chat, library）的代码。保持高内聚，不要把 Housing 独有的逻辑泄露到外层全局目录。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { isDormMention } from '../../utils/housingUtils';

interface TypewriterTextProps {
    text: string;
    speed?: number;
    onComplete?: () => void;
}

export const TypewriterText: React.FC<TypewriterTextProps> = ({ text, speed = 5, onComplete }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        // Reset if text changes significantly (new message)
        if (text.length > 0 && currentIndex === 0) {
            setDisplayedText('');
        }
    }, [text]);

    useEffect(() => {
        if (currentIndex < text.length) {
            // Adaptive speed: faster if text is long or we are far behind
            // standard speed 5ms, but if text > 200 chars, go faster (2ms)
            // also render chunks of characters to prevent React render bottleneck
            const isLong = text.length > 150;
            const chunkSize = isLong ? 3 : 1;
            const renderSpeed = isLong ? 2 : speed;

            const timeout = setTimeout(() => {
                const nextIndex = Math.min(currentIndex + chunkSize, text.length);
                setDisplayedText(text.slice(0, nextIndex));
                setCurrentIndex(nextIndex);
            }, renderSpeed);

            return () => clearTimeout(timeout);
        } else if (currentIndex >= text.length && onComplete) {
            // Ensure we only call onComplete once when actually done
            onComplete();
        }
    }, [currentIndex, text, speed, onComplete]);

    return (
        <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-100 text-gray-800">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    strong: ({ node, ...props }) => {
                        const content = String(props.children);
                        const isDorm = isDormMention(content);
                        return <span className={isDorm ? "font-extrabold text-illini-orange" : "font-bold text-gray-900"} {...props} />;
                    }
                }}
            >
                {displayedText}
            </ReactMarkdown>
        </div>
    );
};
