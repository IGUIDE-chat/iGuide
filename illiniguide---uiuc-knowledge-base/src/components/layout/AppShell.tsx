import React from 'react';

interface AppShellProps {
  isSidebarOpen: boolean;
  sidebar: React.ReactNode;
  mobileHeader: React.ReactNode;
  children: React.ReactNode;
  sidebarToggleButtonRef: React.RefObject<HTMLButtonElement | null>;
  mobileSidebarButtonRef: React.RefObject<HTMLButtonElement | null>;
  onCloseSidebar: () => void;
  onOpenSidebar: () => void;
  onToggleSidebar: () => void;
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
  return (
    <div className="flex h-[100dvh] w-full bg-white text-slate-900 font-sans overflow-hidden">
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 md:hidden ${
          isSidebarOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
        onClick={onCloseSidebar}
      />

      <aside
        className={`
          fixed inset-y-0 left-0 z-50 bg-[#171717] text-slate-200 flex flex-col transition-all duration-300 ease-in-out
          md:relative
          ${
            isSidebarOpen
              ? 'translate-x-0 w-[180px]'
              : '-translate-x-full w-[180px] md:w-0 md:translate-x-0 md:overflow-hidden'
          }
        `}
      >
        <div className="flex flex-col h-full w-[180px]">{sidebar}</div>
      </aside>

      <main className="flex-1 flex flex-col relative h-full w-full bg-white min-w-0">
        <div className="hidden md:block absolute top-3 left-3 z-40">
          <button
            ref={sidebarToggleButtonRef}
            onClick={onToggleSidebar}
            className="text-slate-400 hover:text-illini-blue p-2 rounded-md hover:bg-illini-blue/5 transition-colors"
            title={isSidebarOpen ? 'Close Sidebar' : 'Open Sidebar'}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>

        <div className="md:hidden flex items-center gap-2 p-3 border-b border-slate-100 bg-white sticky top-0 z-20">
          <button
            ref={mobileSidebarButtonRef}
            onClick={onOpenSidebar}
            className="h-10 w-10 shrink-0 text-slate-500 flex items-center justify-center rounded-xl bg-slate-100 border border-slate-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
          {mobileHeader}
        </div>

        <div className="flex-1 overflow-hidden relative min-w-0">{children}</div>
      </main>
    </div>
  );
};
