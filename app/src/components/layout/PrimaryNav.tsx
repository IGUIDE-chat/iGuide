/**
 * @file ./src/components/layout/PrimaryNav.tsx
 * @description Layout Component / Module
 * @description_zh 此文件属于 Layout 层，仅负责布局、导航。严禁在此处堆积业务逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from "react"
import { AnimatePresence, motion } from "framer-motion"
import { BrandMark } from "../ui/branding/BrandMark"

interface NavItem {
  key: string
  label: string
  icon: React.ReactNode
  onClick: () => void
}

interface PrimaryNavProps {
  appTitle: string
  activeTab: string
  isSidebarOpen: boolean
  navItems: NavItem[]
  onCloseSidebar: () => void
}

const AnimatedText = ({ children }: { children: React.ReactNode }) => (
  <AnimatePresence mode="wait">
    <motion.span
      key={children?.toString()}
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ duration: 0.15 }}
      style={{ display: "inline-block" }}
    >
      {children}
    </motion.span>
  </AnimatePresence>
)

const SidebarLabel = ({
  isOpen,
  children,
  className = "",
}: {
  isOpen: boolean
  children: React.ReactNode
  className?: string
}) => (
  <motion.span
    initial={false}
    animate={
      isOpen
        ? { opacity: 1, x: 0, maxWidth: 220 }
        : { opacity: 0, x: -6, maxWidth: 0 }
    }
    transition={{ duration: 0.2, ease: "easeOut" }}
    className={`inline-block overflow-hidden whitespace-nowrap ${className} `}
  >
    {children}
  </motion.span>
)

export const PrimaryNav: React.FC<PrimaryNavProps> = ({
  appTitle,
  activeTab,
  isSidebarOpen,
  navItems,
  onCloseSidebar,
}) => {
  return (
    <>
      <div className="mb-2 flex items-center justify-between p-3">
        <div className="flex w-full cursor-pointer items-center gap-2 rounded-md p-2 transition-colors hover:bg-white/5">
          <BrandMark
            className="size-[26px] rounded-md"
            iconClassName="text-[10px]"
          />
          <SidebarLabel
            isOpen={isSidebarOpen}
            className="text-[15px] font-bold tracking-tight text-white"
          >
            <AnimatedText>{appTitle}</AnimatedText>
          </SidebarLabel>
        </div>
        <button
          onClick={onCloseSidebar}
          className="p-2 text-slate-400 hover:text-white md:hidden"
        >
          ×
        </button>
      </div>

      <nav className="mb-2 space-y-1 px-3">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={item.onClick}
            className={`flex w-full items-center gap-3 rounded-md p-3 text-sm transition-colors ${
              activeTab === item.key
                ? "bg-[#212121] text-white"
                : `text-slate-300 hover:bg-[#212121]`
            } `}
          >
            <span>{item.icon}</span>
            <SidebarLabel isOpen={isSidebarOpen}>
              <AnimatedText>{item.label}</AnimatedText>
            </SidebarLabel>
          </button>
        ))}
      </nav>
    </>
  )
}
