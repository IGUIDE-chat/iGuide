// [COMPONENT] Text with a moving highlight, used for "in progress" labels.
// [组件] 带流光效果的文字，用于"进行中"状态的标签。
import React from "react"

interface TextShimmerProps {
  children: React.ReactNode
  className?: string
}

export const TextShimmer: React.FC<TextShimmerProps> = ({ children, className = "" }) => (
  <span className={`text-shimmer ${className} `}>{children}</span>
)
