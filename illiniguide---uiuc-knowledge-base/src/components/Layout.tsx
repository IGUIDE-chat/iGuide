import * as React from 'react';
import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { Language } from '../types';
import { UI_TEXT } from '../i18n/uiText';
import { useAuth } from '../contexts/AuthContext';
import { useHousingFilters } from '../contexts/HousingContext';
import { LayoutProvider } from '../contexts/LayoutContext';
import { useDormFilterBadge } from '../hooks/useDormFilterBadge';
import { AppShell } from './layout/AppShell';
import { PrimaryNav } from './layout/PrimaryNav';
import { SidebarPanel } from './layout/SidebarPanel';
import { SidebarFooter } from './layout/SidebarFooter';

interface LayoutProps {
  children: React.ReactNode;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isGuest?: boolean;
  onExitGuest?: () => void;
  currentConversationId?: string | null;
  onNewConversation?: () => void;
  onSelectConversation?: (conversationId: string | null) => void;
  activeTab?: string;
  onTabChange?: (tab: any) => void;
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
  const t = UI_TEXT[language];
  const { user } = useAuth();
  const { searchTerm, setSearchTerm, setIsFilterModalOpen } = useHousingFilters();
  const { hasActiveDormFilters, activeDormFilterCount } = useDormFilterBadge();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const favoritesIconRef = useRef<SVGSVGElement | null>(null);
  const sidebarToggleButtonRef = useRef<HTMLButtonElement | null>(null);
  const mobileSidebarButtonRef = useRef<HTMLButtonElement | null>(null);

  const activeTab = React.useMemo(() => {
    if (propActiveTab) {
      return propActiveTab;
    }
    if (location.pathname.startsWith('/library')) return 'library';
    if (location.pathname.startsWith('/courses')) return 'courses';
    if (location.pathname.startsWith('/dorms')) return 'dorms';
    if (location.pathname.startsWith('/resume')) return 'resume';
    return 'chat';
  }, [location.pathname, propActiveTab]);

  const isDormListPage = location.pathname === '/dorms';
  const isHousingMobileHeader = activeTab === 'dorms' && isDormListPage;

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const handleMediaChange = (event: MediaQueryListEvent | MediaQueryList) => {
      setIsSidebarOpen(event.matches);
    };

    handleMediaChange(mediaQuery);
    mediaQuery.addEventListener('change', handleMediaChange);

    return () => {
      mediaQuery.removeEventListener('change', handleMediaChange);
    };
  }, []);

  const closeSidebarOnMobile = () => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  };

  const navItems = [
    {
      key: 'chat',
      label: t.chatTab,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
          />
        </svg>
      ),
      onClick: () => {
        onNewConversation?.();
        navigate('/chat');
        closeSidebarOnMobile();
      },
    },
    {
      key: 'library',
      label: t.libraryTab,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
      onClick: () => {
        navigate('/library');
        closeSidebarOnMobile();
      },
    },
    {
      key: 'courses',
      label: t.coursesTab,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
          />
        </svg>
      ),
      onClick: () => {
        navigate('/courses');
        closeSidebarOnMobile();
      },
    },
    {
      key: 'dorms',
      label: t.dormsTab,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
      onClick: () => {
        navigate('/dorms');
        closeSidebarOnMobile();
      },
    },
    {
      key: 'resume',
      label: t.resumeTab,
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      onClick: () => {
        navigate('/resume');
        closeSidebarOnMobile();
      },
    },
  ];

  const mobileHeader = isHousingMobileHeader ? (
    <div className="flex-1 min-w-0 flex items-center gap-2">
      <div className="relative flex-1 min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="text"
          className="block h-10 w-full pl-9 pr-3 border border-gray-200 rounded-full leading-5 bg-gray-50/50 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black/5 focus:border-black/20 text-sm transition-all shadow-sm"
          placeholder={language === 'zh' ? '输入搜索宿舍...' : 'Type to search dorms...'}
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
            w-10 h-10 rounded-full border transition-all duration-200 flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-illini-orange/20
            ${
              hasActiveDormFilters
                ? 'border-illini-orange/40 text-illini-orange bg-illini-orange/10'
                : 'bg-white text-gray-700 border-gray-200'
            }
          `}
        >
          <SlidersHorizontal size={18} strokeWidth={2} />
        </button>
        {hasActiveDormFilters && (
          <div className="absolute -top-1.5 -right-1.5 bg-illini-orange text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm">
            {activeDormFilterCount}
          </div>
        )}
      </div>
    </div>
  ) : (
    <span className="font-semibold text-slate-700 text-sm">
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
  );

  const profileName = user?.name || user?.email || 'User';

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
              onToggleLanguage={() => onLanguageChange(language === 'zh' ? 'en' : 'zh')}
              onGuestLogin={onExitGuest}
            />
          </>
        }
      >
        {children}
      </AppShell>
    </LayoutProvider>
  );
};
