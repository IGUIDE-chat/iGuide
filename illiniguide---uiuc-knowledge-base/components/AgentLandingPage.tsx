import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Language } from '../types';
import { UI_TEXT } from '../constants';

interface AgentLandingPageProps {
    type: 'courses' | 'dorms' | 'resume';
    language: Language;
}

const AGENT_CONFIG = {
    courses: { icon: '📚', gradient: 'from-illini-blue to-blue-600' },
    dorms: { icon: '🏠', gradient: 'from-illini-orange to-orange-500' },
    resume: { icon: '📝', gradient: 'from-emerald-500 to-teal-600' }
};

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
                    className="mx-auto mb-6 w-20 h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-4xl shadow-sm"
                >
                    {config.icon}
                </motion.div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">{title}</h1>

                {/* Coming Soon Badge - matching app style */}
                <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-illini-orange text-white mb-5"
                >
                    {t.comingSoon}
                </motion.span>

                {/* Description */}
                <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto">
                    {desc}
                </p>

                {/* Email Form - matching app input style */}
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
                            {t.notifyMe}
                        </button>
                    </motion.form>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-slate-50 border border-slate-100 rounded-2xl p-5 max-w-xs mx-auto"
                    >
                        <span className="text-2xl mb-2 block">✅</span>
                        <p className="text-slate-600 text-sm font-medium">{t.emailSuccess}</p>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};
