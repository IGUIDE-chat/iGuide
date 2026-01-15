import React, { useState, useEffect } from 'react';
import { Language } from '../types';
import { UI_TEXT } from '../constants';
import { useAuth } from './AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'chat' | 'library';
  onTabChange: (tab: 'chat' | 'library') => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, language, onLanguageChange }) => {
  const t = UI_TEXT[language];
  const { user, logout } = useAuth();
  // Default sidebar open on desktop, closed on mobile
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Initialize state based on screen size only on client side mount
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
    }
  }, []);

  return (
    <div className="flex h-screen w-full bg-white text-slate-900 font-sans overflow-hidden">
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
          ${isSidebarOpen ? 'translate-x-0 w-[260px]' : '-translate-x-full w-[260px] md:w-0 md:translate-x-0 md:overflow-hidden'}
        `}
      >
        <div className="flex flex-col h-full w-[260px]">
          {/* Sidebar Header / Logo */}
          <div className="p-3 mb-2 flex items-center justify-between">
            <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer w-full transition-colors">
              <div className="w-6 h-6 bg-illini-orange rounded flex items-center justify-center font-bold text-white text-xs">I</div>
              <span className="font-semibold text-sm tracking-tight text-white">{t.appTitle}</span>
            </div>
            {/* Mobile Close Button */}
            <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-slate-400 p-2 hover:text-white">✕</button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 space-y-1">
            <button
              onClick={() => { onTabChange('chat'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${activeTab === 'chat' ? 'bg-[#212121] text-white' : 'hover:bg-[#212121] text-slate-300'}`}
            >
              <span>💬</span> {t.chatTab}
            </button>
            <button
              onClick={() => { onTabChange('library'); if (window.innerWidth < 768) setIsSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${activeTab === 'library' ? 'bg-[#212121] text-white' : 'hover:bg-[#212121] text-slate-300'}`}
            >
              <span>📚</span> {t.libraryTab}
            </button>
          </nav>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-white/10 space-y-2">
            {/* User Profile */}
            <div className="px-3 py-2 bg-white/5 rounded-md">
              <div className="text-xs text-slate-400 mb-1">Signed in as</div>
              <div className="text-sm font-medium text-white truncate">{user?.name}</div>
              <div className="text-xs text-slate-400 truncate">{user?.email}</div>
            </div>

            {/* Language Toggle */}
            <button
              onClick={() => onLanguageChange(language === 'zh' ? 'en' : 'zh')}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-[#212121] transition-colors text-slate-300"
            >
              <span>🌐</span> {language === 'zh' ? '语言: 中文' : 'Lang: English'}
            </button>

            {/* Logout Button */}
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-red-500/10 transition-colors text-red-400 hover:text-red-300"
            >
              <span>🚪</span> {language === 'zh' ? '退出登录' : 'Logout'}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative h-full w-full bg-white min-w-0">

        {/* Desktop Sidebar Toggle - Single Button Positioned Absolutely */}
        <div className="hidden md:block absolute top-3 left-3 z-30">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-md hover:bg-slate-100 transition-colors"
            title={isSidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        </div>

        {/* Mobile Header (Only visible on mobile) */}
        <div className="md:hidden flex items-center p-3 border-b border-slate-100 bg-white sticky top-0 z-20">
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-500 mr-4 p-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <span className="font-semibold text-slate-700 text-sm">
            {activeTab === 'chat' ? t.chatTab : t.libraryTab}
          </span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};