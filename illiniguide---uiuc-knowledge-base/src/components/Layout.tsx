// [LAYOUT] Main application wrapper with sidebar and mobile navigation.
// [布局] 包含侧边栏和移动端导航的主要应用容器。
import * as React from 'react';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Language } from '../types';
import { UI_TEXT } from '../i18n/uiText';
import { useAuth } from '../contexts/AuthContext';
import { ConversationSidebar } from './ConversationSidebar';
import { LibrarySidebar } from './LibrarySidebar';
import { DormSidebar } from './DormSidebar';

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

const AnimatedText = ({ children }: { children: React.ReactNode }) => (
  <AnimatePresence mode="wait">
    <motion.span
      key={children?.toString()}
      initial={{ opacity: 0, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ duration: 0.15 }}
      style={{ display: 'inline-block' }}
    >
      {children}
    </motion.span>
  </AnimatePresence>
);

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
  onTabChange
}) => {
  const t = UI_TEXT[language];
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const getActiveTab = () => {
    if (propActiveTab) return propActiveTab;
    if (location.pathname.startsWith('/library')) return 'library';
    if (location.pathname.startsWith('/courses')) return 'courses';
    if (location.pathname.startsWith('/dorms')) return 'dorms';
    if (location.pathname.startsWith('/resume')) return 'resume';
    return 'chat';
  };
  const activeTab = getActiveTab();

  // Default sidebar open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize state based on screen size only on client side mount
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  return (
    <div className="flex h-[100dvh] w-full bg-white text-slate-900 font-sans overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#171717] text-slate-200 flex flex-col transition-all duration-300 ease-in-out
          md:relative
          ${isSidebarOpen ? 'translate-x-0 w-[180px]' : '-translate-x-full w-[180px] md:w-0 md:translate-x-0 md:overflow-hidden'}
        `}
      >
        <div className="flex flex-col h-full w-[180px]">
          {/* Sidebar Header / Logo */}
          <div className="p-3 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer w-full transition-colors">
              <div className="w-6 h-6 bg-illini-orange rounded flex items-center justify-center font-bold text-white text-xs">I</div>
              <span className="font-semibold text-sm tracking-tight text-white"><AnimatedText>{t.appTitle}</AnimatedText></span>
            </div>
            {/* Mobile Close Button */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 p-2 hover:text-white">✕</button>
          </div>

          {/* Navigation */}
          <nav className="px-3 space-y-1 mb-2">
            <button
              onClick={() => {
                onNewConversation();
                navigate('/chat');
                if (window.innerWidth < 768) setIsSidebarOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${activeTab === 'chat' ? 'bg-[#212121] text-white' : 'hover:bg-[#212121] text-slate-300'}`}
            >
              <span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg></span> <AnimatedText>{t.chatTab}</AnimatedText>
            </button>
            <button
              onClick={() => { navigate('/library'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${activeTab === 'library' ? 'bg-[#212121] text-white' : 'hover:bg-[#212121] text-slate-300'}`}
            >
              <span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" /></svg></span> <AnimatedText>{t.libraryTab}</AnimatedText>
            </button>

            {/* Divider */}
            <div className="my-2 border-t border-white/10" />

            {/* New Agent Buttons */}
            <button
              onClick={() => { navigate('/courses'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${activeTab === 'courses' ? 'bg-[#212121] text-white' : 'hover:bg-[#212121] text-slate-300'}`}
            >
              <span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg></span> <AnimatedText>{t.coursesTab}</AnimatedText>
            </button>
            <button
              onClick={() => { navigate('/dorms'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${activeTab === 'dorms' ? 'bg-[#212121] text-white' : 'hover:bg-[#212121] text-slate-300'}`}
            >
              <span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg></span> <AnimatedText>{t.dormsTab}</AnimatedText>
            </button>
            <button
              onClick={() => { navigate('/resume'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${activeTab === 'resume' ? 'bg-[#212121] text-white' : 'hover:bg-[#212121] text-slate-300'}`}
            >
              <span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg></span> <AnimatedText>{t.resumeTab}</AnimatedText>
            </button>
          </nav>

          {/* Divider */}
          <div className="mx-3 my-2 border-t border-white/10" />

          {/* Middle Section - Sidebar Content */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === 'chat' && (
              <ConversationSidebar
                currentConversationId={currentConversationId ?? null}
                onSelectConversation={onSelectConversation ?? (() => { })}
                onNewConversation={onNewConversation ?? (() => { })}
                language={language}
              />
            )}
            {activeTab === 'library' && (
              <LibrarySidebar
                language={language}
                currentArticleId={location.pathname.startsWith('/library/article/') ? location.pathname.split('/').pop() : undefined}
              />
            )}
            {activeTab === 'dorms' && (
              <DormSidebar
                language={language}
                currentDormId={location.pathname.startsWith('/dorms/') ? location.pathname.split('/').pop() : undefined}
              />
            )}
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-white/10 space-y-2">
            {/* Language Toggle */}
            <button
              onClick={() => onLanguageChange(language === 'zh' ? 'en' : 'zh')}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-[#212121] transition-colors text-slate-300"
            >
              <span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></span> <AnimatedText>{language === 'zh' ? '中文' : 'English'}</AnimatedText>
            </button>

            {/* User Profile / Login Button */}
            {isGuest ? (
              <button
                onClick={onExitGuest}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-[#212121] transition-colors text-white group"
              >
                <div className="w-5 h-5 bg-illini-orange rounded-sm flex items-center justify-center font-bold text-white text-[10px] group-hover:scale-110 transition-transform">I</div>
                <AnimatedText>{language === 'zh' ? '登录' : 'Login'}</AnimatedText>
              </button>
            ) : (
              <Link
                to="/profile"
                className="flex items-center gap-3 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer transition-colors block"
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-illini-orange flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] text-slate-400">Signed in as</div>
                  <div className="text-xs font-medium text-white truncate">{user?.name || user?.email}</div>
                </div>
              </Link>
            )}
          </div>
        </div>
      </aside >

      {/* Main Content */}
      < main className="flex-1 flex flex-col relative h-full w-full bg-white min-w-0" >

        {/* Desktop Sidebar Toggle - Single Button Positioned Absolutely */}
        < div className="hidden md:block absolute top-3 left-3 z-30" >
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-100 transition-colors"
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div >

        {/* Mobile Header (Only visible on mobile) */}
        < div className="md:hidden flex items-center p-3 border-b border-slate-100 bg-white sticky top-0 z-20" >
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 mr-4 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-semibold text-slate-700 text-sm">
            {activeTab === 'chat' ? t.chatTab : activeTab === 'library' ? t.libraryTab : activeTab === 'courses' ? t.coursesTab : activeTab === 'dorms' ? t.dormsTab : activeTab === 'resume' ? t.resumeTab : t.chatTab}
          </span>
        </div >

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main >
    </div >
  );
};
