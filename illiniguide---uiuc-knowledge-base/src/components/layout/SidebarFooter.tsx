import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BrandMark } from '../branding/BrandMark';

interface SidebarFooterProps {
  isSidebarOpen: boolean;
  isGuest?: boolean;
  languageLabel: string;
  guestLabel: string;
  signedInLabel: string;
  profileName: string;
  onToggleLanguage: () => void;
  onGuestLogin?: () => void;
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
}: {
  isOpen: boolean;
  children: React.ReactNode;
}) => (
  <motion.span
    initial={false}
    animate={isOpen ? { opacity: 1, x: 0, maxWidth: 220 } : { opacity: 0, x: -6, maxWidth: 0 }}
    transition={{ duration: 0.2, ease: 'easeOut' }}
    className="inline-block overflow-hidden whitespace-nowrap"
  >
    {children}
  </motion.span>
);

export const SidebarFooter: React.FC<SidebarFooterProps> = ({
  isSidebarOpen,
  isGuest,
  languageLabel,
  guestLabel,
  signedInLabel,
  profileName,
  onToggleLanguage,
  onGuestLogin,
}) => {
  return (
    <div className="p-3 border-t border-white/10 space-y-2">
      <button
        onClick={onToggleLanguage}
        className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-[#212121] transition-colors text-slate-300"
      >
        <span>
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
        <SidebarLabel isOpen={isSidebarOpen}>
          <AnimatedText>{languageLabel}</AnimatedText>
        </SidebarLabel>
      </button>

      {isGuest ? (
        <button
          onClick={onGuestLogin}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-md text-sm hover:bg-[#212121] transition-colors text-white group"
        >
          <div className="group-hover:scale-110 transition-transform">
            <BrandMark className="h-5 w-5 rounded-[4px]" iconClassName="text-[10px]" />
          </div>
          <SidebarLabel isOpen={isSidebarOpen}>
            <AnimatedText>{guestLabel}</AnimatedText>
          </SidebarLabel>
        </button>
      ) : (
        <Link
          to="/profile"
          className="flex items-center gap-3 px-3 py-2 rounded-md bg-white/5 hover:bg-white/10 cursor-pointer transition-colors block"
        >
          <div className="w-8 h-8 rounded-full bg-illini-orange flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
            {profileName.charAt(0).toUpperCase() || 'U'}
          </div>
          <motion.div
            initial={false}
            animate={isSidebarOpen ? { opacity: 1, x: 0, maxWidth: 180 } : { opacity: 0, x: -6, maxWidth: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex-1 min-w-0 overflow-hidden whitespace-nowrap"
          >
            <div className="text-[10px] text-slate-400">{signedInLabel}</div>
            <div className="text-xs font-medium text-white truncate">{profileName}</div>
          </motion.div>
        </Link>
      )}
    </div>
  );
};
