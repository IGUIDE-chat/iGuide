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
    <div className="
      bg-white font-sans text-slate-900 flex h-dvh w-full overflow-hidden
    ">
      <div
        className={`
          inset-0 bg-black/50
          md:hidden
          fixed z-40 transition-opacity duration-300
          ${
          isSidebarOpen
            ? 'pointer-events-auto opacity-100'
            : 'pointer-events-none opacity-0'
        }
        `}
        onClick={onCloseSidebar}
      />

      <aside
        className={`
          inset-y-0 left-0 text-slate-200 ease-in-out
          md:relative
          fixed z-50 flex flex-col bg-[#171717] transition-all duration-300
          ${
          isSidebarOpen
            ? 'translate-x-0 w-[180px]'
            : `
              md:w-0 md:translate-x-0 md:overflow-hidden
              w-[180px] -translate-x-full
            `
        }
        `}
      >
        <div className="flex h-full w-[180px] flex-col">{sidebar}</div>
      </aside>

      <main className="min-w-0 bg-white relative flex size-full flex-1 flex-col">
        <div className="
          left-3 top-3
          md:block
          absolute z-40 hidden
        ">
          <button
            ref={sidebarToggleButtonRef}
            onClick={onToggleSidebar}
            className="
              rounded-md p-2 text-slate-400
              hover:bg-illini-blue/5 hover:text-illini-blue
              transition-colors
            "
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

        <div className="
          top-0 gap-2 border-slate-100 bg-white p-3
          md:hidden
          sticky z-20 flex items-center border-b
        ">
          <button
            ref={mobileSidebarButtonRef}
            onClick={onOpenSidebar}
            className="
              h-10 w-10 rounded-xl border-slate-200 bg-slate-100 text-slate-500
              flex shrink-0 items-center justify-center border
            "
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

        <div className="min-w-0 relative flex-1 overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  )
}
