/**
 * @file ./src/components/layout/BaseSidebar.tsx
 * @description Shared sidebar layout component with category grouping and animated list items.
 */

import { AnimatePresence, motion } from "framer-motion"
import React from "react"

export const sidebarItemAnimation = {
  layout: true,
  initial: { opacity: 0, x: -20, height: 0 },
  animate: { opacity: 1, x: 0, height: "auto" },
  exit: { opacity: 0, height: 0 },
  transition: {
    type: "spring" as const,
    stiffness: 500,
    damping: 30,
    opacity: { duration: 0.2 },
  },
}

export interface TimeCategoryLabels {
  pinned: string
  today: string
  yesterday: string
  thisWeek: string
  older: string
}

export const getTimeCategory = (
  dateStr: string,
  labels: TimeCategoryLabels
): string => {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return labels.today
  }
  if (diffDays === 1) {
    return labels.yesterday
  }
  if (diffDays <= 7) {
    return labels.thisWeek
  }
  return labels.older
}

export const getCategoryOrder = (labels: TimeCategoryLabels): string[] => [
  labels.pinned,
  labels.today,
  labels.yesterday,
  labels.thisWeek,
  labels.older,
]

export const groupByCategory = <T extends { isPinned: boolean }>(
  items: T[],
  getDate: (item: T) => string,
  labels: TimeCategoryLabels
): Record<string, T[]> => {
  return items.reduce(
    (groups, item) => {
      const category = item.isPinned
        ? labels.pinned
        : getTimeCategory(getDate(item), labels)

      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(item)
      return groups
    },
    {} as Record<string, T[]>
  )
}

interface BaseSidebarProps {
  header?: React.ReactNode
  groupedItems: Record<string, unknown[]>
  categoryOrder: string[]
  renderItem: (item: unknown, index: number) => React.ReactNode
  emptyState?: React.ReactNode
  loadingState?: React.ReactNode
  isLoading?: boolean
  className?: string
}

export const BaseSidebar: React.FC<BaseSidebarProps> = ({
  header,
  groupedItems,
  categoryOrder,
  renderItem,
  emptyState,
  loadingState,
  isLoading = false,
  className = "",
}) => {
  const hasItems = Object.values(groupedItems).some(
    (items) => items && items.length > 0
  )

  return (
    <div className={`flex h-full flex-col ${className} `}>
      {header}

      <div className="no-scrollbar flex-1 overflow-y-auto px-2">
        {isLoading && loadingState}
        {!isLoading && !hasItems && emptyState}
        {!isLoading && hasItems && (
          <div className="space-y-3">
            {categoryOrder.map((category) => {
              const items = groupedItems[category]
              if (!items || items.length === 0) {
                return null
              }

              return (
                <div key={category}>
                  <h4 className="mb-1.5 px-2 text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                    {category}
                  </h4>
                  <div className="space-y-0.5">
                    <AnimatePresence initial={false}>
                      {items.map((item, index) => renderItem(item, index))}
                    </AnimatePresence>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

interface SidebarItemProps {
  id: string
  isActive: boolean
  onClick: () => void
  children: React.ReactNode
  activeBgClass?: string
  inactiveBgClass?: string
}

export const SidebarItem: React.FC<SidebarItemProps> = ({
  isActive,
  onClick,
  children,
  activeBgClass = "bg-white/20 text-white",
  inactiveBgClass = "text-slate-300 hover:bg-white/10",
}) => (
  <motion.div
    {...sidebarItemAnimation}
    onClick={onClick}
    className={`group relative cursor-pointer rounded-lg p-2 transition-all ${isActive ? activeBgClass : inactiveBgClass} `}
  >
    {children}
  </motion.div>
)

interface PinButtonProps {
  isPinned: boolean
  onClick: (e: React.MouseEvent) => void
  label: string
}

export const PinButton: React.FC<PinButtonProps> = ({
  isPinned,
  onClick,
  label,
}) => (
  <button
    aria-label="Action"
    type="button"
    onClick={onClick}
    className="rounded-md p-1 transition-colors hover:bg-white/10"
    title={label}
  >
    <svg
      className={`size-3.5 ${isPinned ? "text-illini-orange" : "text-slate-400"} `}
      fill={isPinned ? "currentColor" : "none"}
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
      />
    </svg>
  </button>
)

interface DeleteButtonProps {
  onClick: (e: React.MouseEvent) => void
  label: string
}

export const DeleteButton: React.FC<DeleteButtonProps> = ({
  onClick,
  label,
}) => (
  <button
    aria-label="Action"
    type="button"
    onClick={onClick}
    className="rounded-md p-1 transition-colors hover:bg-red-500/20"
    title={label}
  >
    <svg
      className="size-3.5 text-red-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
      />
    </svg>
  </button>
)

export const SidebarLoadingSpinner: React.FC = () => (
  <div className="flex items-center justify-center py-8">
    <div className="border-illini-orange size-5 animate-spin rounded-full border-2 border-t-transparent" />
  </div>
)

interface SidebarEmptyStateProps {
  message: string
}

export const SidebarEmptyState: React.FC<SidebarEmptyStateProps> = ({
  message,
}) => (
  <div className="px-2 py-6 text-center">
    <p className="text-xs text-slate-500">{message}</p>
  </div>
)
