import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { BrandMark } from '../branding/BrandMark';

interface NavItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

interface PrimaryNavProps {
  appTitle: string;
  activeTab: string;
  isSidebarOpen: boolean;
  navItems: NavItem[];
  onCloseSidebar: () => void;
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

const SidebarLabel = ({
  isOpen,
  children,
  className = '',
}: {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}) => (
  <motion.span
    initial={false}
    animate={isOpen ? { opacity: 1, x: 0, maxWidth: 220 } : { opacity: 0, x: -6, maxWidth: 0 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className={`inline-block overflow-hidden whitespace-nowrap ${className}`}
  >
    {children}
  </motion.span>
);

export const PrimaryNav: React.FC<PrimaryNavProps> = ({
  appTitle,
  activeTab,
  isSidebarOpen,
  navItems,
  onCloseSidebar,
}) => {
  return (
    <>
      <div className="p-3 mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-white/5 cursor-pointer w-full transition-colors">
          <BrandMark className="h-[26px] w-[26px] rounded-md" iconClassName="text-[10px]" />
          <SidebarLabel
            isOpen={isSidebarOpen}
            className="font-bold text-[15px] tracking-tight text-white"
          >
            <AnimatedText>{appTitle}</AnimatedText>
          </SidebarLabel>
        </div>
        <button
          onClick={onCloseSidebar}
          className="md:hidden text-slate-400 p-2 hover:text-white"
        >
          ×
        </button>
      </div>

      <nav className="px-3 space-y-1 mb-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={item.onClick}
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm transition-colors ${activeTab === item.key
              ? 'bg-[#212121] text-white'
              : 'hover:bg-[#212121] text-slate-300'
              }`}
          >
            <span>{item.icon}</span>
            <SidebarLabel isOpen={isSidebarOpen}>
              <AnimatedText>{item.label}</AnimatedText>
            </SidebarLabel>
          </button>
        ))}
      </nav>
    </>
  );
};
