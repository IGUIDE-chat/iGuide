/**
 * @file ./src/components/layout/Layout.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

import * as React from 'react'
import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  Search,
  SlidersHorizontal,
  Map as MapIcon,
  List,
  ArrowUpDown,
} from 'lucide-react'
import { Language } from '../../types'
import { UI_TEXT } from '../../i18n/uiText'
import { useAuth } from '../../contexts/AuthContext'
import { useHousingFilters } from '../housing/store/HousingContext'
import { LayoutProvider } from '../../contexts/LayoutContext'
import { useDormFilterBadge } from '../housing/hooks/useDormFilterBadge'
import { AppShell } from './AppShell'
import { PrimaryNav } from './PrimaryNav'
import { SidebarPanel } from './SidebarPanel'
import { SidebarFooter } from './SidebarFooter'

// ── Lightweight mobile sort dropdown (avoids cross-domain import) ─────────
const SORT_OPTIONS = [
  { value: 'name-asc', label: 'A-Z' },
  { value: 'name-desc', label: 'Z-A' },
  { value: 'price-asc', label: 'Price ↑' },
  { value: 'price-desc', label: 'Price ↓' },
] as const

const SortDropdownMobile: React.FC<{
  sortBy: string
  onSortChange: (v: string) => void
}> = ({ sortBy, onSortChange }) => {
  const [open, setOpen] = React.useState(false)
  const ref = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`
          h-10 w-10 flex items-center justify-center rounded-full border
          transition-all duration-200
          ${
            open
              ? 'border-illini-blue/50 bg-illini-blue/10 text-illini-blue'
              : 'border-gray-200 bg-white text-gray-700'
          }
        `}
      >
        <ArrowUpDown size={18} strokeWidth={2} />
      </button>
      {open && (
        <div
          className="
            right-0 mt-2 w-36 rounded-xl border-gray-100 bg-white py-1 shadow-lg
            absolute z-50 border
          "
        >
          {SORT_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onSortChange(o.value)
                setOpen(false)
              }}
              className={`
                px-4 py-2 text-sm w-full text-left transition-colors
                ${
                  sortBy === o.value
                    ? `bg-illini-blue/5 font-medium text-illini-blue`
                    : `
                      text-gray-600
                      hover:bg-gray-50
                    `
                }
              `}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

interface LayoutProps {
  children: React.ReactNode
  language: Language
  onLanguageChange: (lang: Language) => void
  isGuest?: boolean
  onExitGuest?: () => void
  currentConversationId?: string | null
  onNewConversation?: () => void
  onSelectConversation?: (conversationId: string | null) => void
  activeTab?: string
  onTabChange?: (tab: any) => void
}

export const Layout: React.FC<LayoutProps> = ({
  children,
  language,
  onLanguageChange,
  isGuest,
  onExitGuest,
  currentConversationId,
  onNewConversation,
  onSelectConversation,
  activeTab: propActiveTab,
}) => {
  const t = UI_TEXT[language]
  const { user } = useAuth()
  const {
    searchTerm,
    setSearchTerm,
    setIsFilterModalOpen,
    viewMode,
    setViewMode,
    sortBy,
    setSortBy,
  } = useHousingFilters()
  const { hasActiveDormFilters, activeDormFilterCount } = useDormFilterBadge()
  const navigate = useNavigate()
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)
  const favoritesIconRef = useRef<SVGSVGElement | null>(null)
  const sidebarToggleButtonRef = useRef<HTMLButtonElement | null>(null)
  const mobileSidebarButtonRef = useRef<HTMLButtonElement | null>(null)

  const activeTab = React.useMemo(() => {
    if (propActiveTab) {
      return propActiveTab
    }
    if (location.pathname.startsWith('/library')) return 'library'
    if (location.pathname.startsWith('/courses')) return 'courses'
    if (location.pathname.startsWith('/dorms')) return 'dorms'
    if (location.pathname.startsWith('/resume')) return 'resume'
    return 'chat'
  }, [location.pathname, propActiveTab])

  const isDormListPage = location.pathname === '/dorms'
  const isHousingMobileHeader = activeTab === 'dorms' && isDormListPage

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)')
    const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsSidebarOpen(event.matches)
    }

    handleMediaChange(mediaQuery)
    mediaQuery.addEventListener('change', handleMediaChange)

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange)
    }
  }, [])

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false)
    }
  }

  const navItems = [
    {
      key: 'chat',
      label: t.chatTab,
      icon: (
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
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      onClick: () => {
        onNewConversation?.()
        navigate('/chat')
        closeSidebarOnMobile()
      },
    },
    {
      key: 'library',
      label: t.libraryTab,
      icon: (
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
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      onClick: () => {
        navigate('/library')
        closeSidebarOnMobile()
      },
    },
    {
      key: 'courses',
      label: t.coursesTab,
      icon: (
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      onClick: () => {
        navigate('/courses')
        closeSidebarOnMobile()
      },
    },
    {
      key: 'dorms',
      label: t.dormsTab,
      icon: (
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
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      onClick: () => {
        navigate('/dorms')
        closeSidebarOnMobile()
      },
    },
    {
      key: 'resume',
      label: t.resumeTab,
      icon: (
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
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      onClick: () => {
        navigate('/resume')
        closeSidebarOnMobile()
      },
    },
  ]

  const mobileHeader = isHousingMobileHeader ? (
    <div className="min-w-0 gap-2 flex flex-1 items-center">
      <div className="min-w-0 relative flex-1">
        <Search
          className="
            left-3 h-4 w-4 text-gray-400 pointer-events-none absolute top-1/2
            -translate-y-1/2
          "
        />
        <input
          type="text"
          className="
            h-10 border-gray-200 bg-gray-50/50 pl-9 pr-3 text-sm leading-5
            placeholder-gray-400 shadow-sm
            focus:border-black/20 focus:ring-black/5
            block w-full rounded-full border transition-all
            focus:ring-2 focus:outline-none
          "
          placeholder={
            language === 'zh' ? '输入搜索宿舍...' : 'Type to search dorms...'
          }
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
        />
      </div>
      <div className="relative shrink-0">
        <button
          type="button"
          aria-label={language === 'zh' ? '筛选' : 'Filters'}
          onClick={() => setIsFilterModalOpen(true)}
          className={`
            h-10 w-10
            focus:ring-illini-orange/20
            flex items-center justify-center rounded-full border transition-all
            duration-200
            focus:ring-2 focus:outline-none
            ${
              hasActiveDormFilters
                ? `
                  border-illini-orange/40 bg-illini-orange/10 text-illini-orange
                `
                : 'border-gray-200 bg-white text-gray-700'
            }
          `}
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </button>
        {hasActiveDormFilters && (
          <div
            className="
              -right-1.5 -top-1.5 h-5 w-5 border-white bg-illini-orange
              font-bold text-white shadow-sm absolute flex items-center
              justify-center rounded-full border-2 text-[10px]
            "
          >
            {activeDormFilterCount}
          </div>
        )}
      </div>
      <SortDropdownMobile sortBy={sortBy} onSortChange={setSortBy} />
      <button
        type="button"
        aria-label={
          viewMode === 'list'
            ? language === 'zh'
              ? '地图'
              : 'Map'
            : language === 'zh'
              ? '列表'
              : 'List'
        }
        onClick={() => setViewMode(viewMode === 'list' ? 'map' : 'list')}
        className="
          h-10 w-10 border-gray-200 bg-white text-gray-700 flex shrink-0
          items-center justify-center rounded-full border transition-all
          duration-200
          active:scale-95
        "
      >
        {viewMode === 'list' ? (
          <MapIcon size={18} strokeWidth={2} />
        ) : (
          <List size={18} strokeWidth={2} />
        )}
      </button>
    </div>
  ) : (
    <span className="text-sm font-semibold text-slate-700">
      {activeTab === 'chat'
        ? t.chatTab
        : activeTab === 'library'
          ? t.libraryTab
          : activeTab === 'courses'
            ? t.coursesTab
            : activeTab === 'dorms'
              ? t.dormsTab
              : activeTab === 'resume'
                ? t.resumeTab
                : t.chatTab}
    </span>
  )

  const profileName = user?.name || user?.email || 'User'

  return (
    <LayoutProvider
      isSidebarOpen={isSidebarOpen}
      favoritesIconRef={favoritesIconRef}
      sidebarToggleButtonRef={sidebarToggleButtonRef}
      mobileSidebarButtonRef={mobileSidebarButtonRef}
    >
      <AppShell
        isSidebarOpen={isSidebarOpen}
        sidebarToggleButtonRef={sidebarToggleButtonRef}
        mobileSidebarButtonRef={mobileSidebarButtonRef}
        onCloseSidebar={() => setIsSidebarOpen(false)}
        onOpenSidebar={() => setIsSidebarOpen(true)}
        onToggleSidebar={() => setIsSidebarOpen((current) => !current)}
        mobileHeader={mobileHeader}
        sidebar={
          <>
            <PrimaryNav
              appTitle={t.appTitle}
              activeTab={activeTab}
              isSidebarOpen={isSidebarOpen}
              navItems={navItems}
              onCloseSidebar={() => setIsSidebarOpen(false)}
            />
            <SidebarPanel
              activeTab={activeTab}
              language={language}
              currentPath={location.pathname}
              currentConversationId={currentConversationId}
              onNewConversation={onNewConversation}
              onSelectConversation={onSelectConversation}
              favoritesIconRef={favoritesIconRef}
            />
            <SidebarFooter
              isSidebarOpen={isSidebarOpen}
              isGuest={isGuest}
              languageLabel={language === 'zh' ? '中文' : 'English'}
              guestLabel={language === 'zh' ? '登录' : 'Login'}
              signedInLabel={language === 'zh' ? '当前账号' : 'Signed in as'}
              profileName={profileName}
              onToggleLanguage={() =>
                onLanguageChange(language === 'zh' ? 'en' : 'zh')
              }
              onGuestLogin={onExitGuest}
            />
          </>
        }
      >
        {children}
      </AppShell>
    </LayoutProvider>
  )
}
