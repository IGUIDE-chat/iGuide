/**
 * @file ./src/components/layout/AppShell.tsx
 * @description Layout Component / Module
 * @description_zh 此文件属于 Layout 层，仅负责布局、导航。严禁在此处堆积业务逻辑。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import React from 'react'
import { useLayout } from '../../contexts/LayoutContext'

interface AppShellProps {
  isSidebarOpen: boolean
  sidebar: React.ReactNode
  mobileHeader: React.ReactNode
  children: React.ReactNode
  sidebarToggleButtonRef: React.RefObject<HTMLButtonElement | null>
  mobileSidebarButtonRef: React.RefObject<HTMLButtonElement | null>
  onCloseSidebar: () => void
  onOpenSidebar: () => void
  onToggleSidebar: () => void
}

export const AppShell: React.FC<AppShellProps> = ({
  isSidebarOpen,
  sidebar,
  mobileHeader,
  children,
  sidebarToggleButtonRef,
  mobileSidebarButtonRef,
  onCloseSidebar,
  onOpenSidebar,
  onToggleSidebar,
}) => {
  const layout = useLayout()
  const headerSlot = layout.mobileHeaderSlot

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-white font-sans text-slate-900">
      <div
        className={`fixed inset-0 z-40 bg-black/50 transition-opacity duration-300 md:hidden ${
          isSidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }`}
        onClick={onCloseSidebar}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#171717] text-slate-200 transition-all duration-300 ease-in-out md:relative ${
          isSidebarOpen
            ? 'w-[180px] translate-x-0'
            : 'w-[180px] -translate-x-full md:w-0 md:translate-x-0 md:overflow-hidden'
        } `}
      >
        <div className="flex h-full w-[180px] flex-col">{sidebar}</div>
      </aside>

      <main className="relative flex h-full w-full min-w-0 flex-1 flex-col bg-white">
        <div className="absolute left-3 top-3 z-40 hidden md:block">
          <button
            ref={sidebarToggleButtonRef}
            onClick={onToggleSidebar}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-illini-blue/5 hover:text-illini-blue"
            title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <div className="sticky top-0 z-20 flex items-center gap-2 border-b border-slate-100 bg-white p-3 md:hidden">
          <button
            ref={mobileSidebarButtonRef}
            onClick={onOpenSidebar}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-slate-100 text-slate-500"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {headerSlot ?? mobileHeader}
        </div>

        <div className="relative min-w-0 flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
