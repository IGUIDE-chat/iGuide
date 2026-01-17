import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { UI_TEXT } from '../constants';

interface AgentLandingPageProps {
    type: 'courses' | 'dorms' | 'resume';
    language: Language;
}

const AGENT_CONFIG = {
    courses: {
        icon: <svg className="w-10 h-10 text-illini-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
        gradient: 'from-illini-blue to-blue-600'
    },
    dorms: {
        icon: <svg className="w-10 h-10 text-illini-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>,
        gradient: 'from-illini-orange to-orange-500'
    },
    resume: {
        icon: <svg className="w-10 h-10 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
        gradient: 'from-emerald-500 to-teal-600'
    }
};

// Animated text component for smooth language switching
const AnimatedText = ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <AnimatePresence mode="wait">
        <motion.span
            key={children?.toString()}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={className}
            style={{ display: 'inline-block' }}
        >
            {children}
        </motion.span>
    </AnimatePresence>
);

export const AgentLandingPage: React.FC<AgentLandingPageProps> = ({ type, language }) => {
    const t = UI_TEXT[language];
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const config = AGENT_CONFIG[type];

    const title = type === 'courses' ? t.coursesTitle : type === 'dorms' ? t.dormsTitle : t.resumeTitle;
    const desc = type === 'courses' ? t.coursesDesc : type === 'dorms' ? t.dormsDesc : t.resumeDesc;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        const storageKey = `agent_waitlist_${type}`;
        const existing = JSON.parse(localStorage.getItem(storageKey) || '[]');
        if (!existing.includes(email)) {
            existing.push(email);
            localStorage.setItem(storageKey, JSON.stringify(existing));
        }
        setSubmitted(true);
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-white overflow-auto p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="max-w-md w-full text-center"
            >
                {/* Icon with subtle background */}
                <motion.div
                    initial={{ scale: 0.9 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring' }}
                    className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm"
                >
                    {config.icon}
                </motion.div>

                {/* Title with animation - fixed height to prevent layout shift */}
                <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight h-8 flex items-center justify-center">
                    <AnimatedText>{title}</AnimatedText>
                </h1>

                {/* Coming Soon Badge with animation */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="mb-5 h-7 flex items-center justify-center"
                >
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-illini-orange text-white">
                        <AnimatedText>{t.comingSoon}</AnimatedText>
                    </span>
                </motion.div>

                {/* Description with animation - fixed min-height to prevent layout shift */}
                <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto min-h-[3.5rem]">
                    <AnimatedText>{desc}</AnimatedText>
                </p>

                {/* Email Form */}
                {!submitted ? (
                    <motion.form
                        onSubmit={handleSubmit}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="space-y-3 max-w-xs mx-auto"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-gradient-to-r from-illini-blue to-illini-orange opacity-0 group-focus-within:opacity-10 blur-xl rounded-full transition-opacity" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.emailPlaceholder}
                                required
                                className="relative w-full px-4 py-3 rounded-full border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/10 focus:border-slate-300 shadow-sm text-sm transition-all"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 rounded-full font-semibold text-sm text-white bg-illini-orange hover:bg-illini-orange/90 transition-colors shadow-md active:scale-[0.98]"
                        >
                            <AnimatedText>{t.notifyMe}</AnimatedText>
                        </button>
                    </motion.form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-5 max-w-xs mx-auto"
                    >
                        <span className="text-2xl mb-2 block">✅</span>
                        <p className="text-slate-600 text-sm font-medium">
                            <AnimatedText>{t.emailSuccess}</AnimatedText>
                        </p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};
