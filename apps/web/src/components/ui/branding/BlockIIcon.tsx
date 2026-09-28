import React from "react"

interface BlockIIconProps {
  className?: string
}

export const BlockIIcon: React.FC<BlockIIconProps> = ({ className = "text-lg" }) => (
  <span
    className={`leading-none font-black tracking-[-0.06em] select-none ${className} `}
    aria-hidden="true"
  >
    I
  </span>
)
