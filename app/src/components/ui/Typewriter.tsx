/**
 * @file ./src/components/ui/Typewriter.tsx
 * @description Global Shared Component / Module
 * @description_zh 统一的打字机组件，支持三种模式：animate（Framer Motion 逐字动画）、stream（逐字流式渲染）、static（静态渲染）。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import * as React from "react";
import { motion } from "framer-motion";
import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";

export type TypewriterMode = "animate" | "stream" | "static";

export interface TypewriterProps {
  text: string;

  /**
   * Animation mode:
   *  - "animate": Framer Motion character-by-character with slow-to-fast easing (for short titles)
   *  - "stream": useState/useEffect character reveal with adaptive speed (for streaming responses)
   *  - "static": No animation, just render (for completed messages)
   * @default "static"
   */
  mode?: TypewriterMode;

  speed?: number;
  delay?: number;
  className?: string;
  markdown?: boolean;
  markdownComponents?: Components;
  onComplete?: () => void;
}

const AnimateTypewriter: React.FC<{
  text: string;
  className?: string;
  delay?: number;
}> = ({ text, className = "", delay = 0 }) => {
  const characters = text.split("");

  return (
    <span className={className}>
      {characters.map((char, index) => {
        let cumulativeDelay = delay;
        const startGap = 0.15;
        const minGap = 0.01;
        const decay = 0.9;

        let currentGap = startGap;
        for (let i = 0; i < index; i++) {
          cumulativeDelay += currentGap;
          currentGap = Math.max(minGap, currentGap * decay);
        }

        return (
          <motion.span
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              duration: 0.1,
              delay: cumulativeDelay,
              ease: "easeOut",
            }}
          >
            {char}
          </motion.span>
        );
      })}
    </span>
  );
};

const useStreamText = (
  text: string,
  speed: number,
  onComplete?: () => void
) => {
  const [displayedText, setDisplayedText] = React.useState("");
  const [currentIndex, setCurrentIndex] = React.useState(0);

  React.useEffect(() => {
    if (text.length > 0 && currentIndex === 0) {
      queueMicrotask(() => setDisplayedText(""));
    }
  }, [text, currentIndex]);

  React.useEffect(() => {
    if (currentIndex < text.length) {
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
      onComplete();
    }
  }, [currentIndex, text, speed, onComplete]);

  return displayedText;
};

export const Typewriter: React.FC<TypewriterProps> = ({
  text,
  mode = "static",
  speed = 5,
  delay = 0,
  className = "",
  markdown = false,
  markdownComponents,
  onComplete,
}) => {
  const streamedText = useStreamText(
    mode === "stream" ? text : "",
    speed,
    mode === "stream" ? onComplete : undefined
  );

  if (mode === "static") {
    if (markdown) {
      return (
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={markdownComponents}
        >
          {text || ""}
        </ReactMarkdown>
      );
    }
    return <span className={className}>{text}</span>;
  }

  if (mode === "animate") {
    return (
      <AnimateTypewriter text={text} className={className} delay={delay} />
    );
  }

  if (mode === "stream") {
    if (markdown) {
      return (
        <div
          className="
            prose prose-sm
            prose-p:leading-relaxed
            prose-pre:bg-gray-100
            max-w-none text-gray-800
          "
        >
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {streamedText}
          </ReactMarkdown>
        </div>
      );
    }

    return <span className={className}>{streamedText}</span>;
  }

  return null;
};
