/**
 * @file ./src/components/chat/TypewriterMarkdown.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [COMPONENT] Markdown renderer with typewriter animation effect.
// [组件] 带有打字机动画效果的 Markdown 渲染组件。
import * as React from 'react'
import ReactMarkdown, { Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface TypewriterMarkdownProps {
  content: string
  isStreaming?: boolean
  speed?: number
  components?: Components
}

// SIMPLIFIED: No typewriter effect, just direct render
export const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({
  content,
  isStreaming = false,
  components,
}) => {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content || ''}
    </ReactMarkdown>
  )
}
