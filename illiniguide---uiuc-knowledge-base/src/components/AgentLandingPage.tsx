/**
 * @file ./src/components/AgentLandingPage.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [PAGE] Landing page template for specific agents (Courses, Dorms, Resume).
// [页面] 用于特定智能体（课程、宿舍、简历）的着陆页模板。
import * as React from 'react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';
import { UI_TEXT } from '../i18n/uiText';
import { mailingListService, MailingListTopic } from '../services/mailingListService';

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

export const AgentLandingPage: React.FC<AgentLandingPageProps> = ({ type, language }) => {
    const t = UI_TEXT[language];
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const config = AGENT_CONFIG[type];

    const title = type === 'courses' ? t.coursesTitle : type === 'dorms' ? t.dormsTitle : t.resumeTitle;
    const desc = type === 'courses' ? t.coursesDesc : type === 'dorms' ? t.dormsDesc : t.resumeDesc;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSubmitting(true);
        setError(null);

        const result = await mailingListService.subscribe(email, type as MailingListTopic);
        setSubmitting(false);

        if (result.success) {
            setSubmitted(true);
        } else {
            setError(language === 'zh' ? '提交失败，请重试。' : 'Failed to submit. Please try again.');
        }
    };

    return (
        <div className="h-full w-full flex items-center justify-center bg-white overflow-auto p-4 md:p-8">
            <div className="max-w-md w-full text-center relative">
                {/* Icon - static, doesn't change with language */}
                <div className="mx-auto mb-4 md:mb-6 w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center shadow-sm">
                    {config.icon}
                </div>

                {/* Animated text content with crossfade */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={language}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        {/* Title */}
                        <h1 className="text-2xl font-bold text-slate-900 mb-3 tracking-tight">
                            {title}
                        </h1>

                        {/* Coming Soon Badge */}
                        <div className="mb-5">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-illini-orange text-white">
                                {t.comingSoon}
                            </span>
                        </div>

                        {/* Description */}
                        <p className="text-slate-500 text-sm leading-relaxed mb-8 max-w-sm mx-auto min-h-[3rem]">
                            {desc}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Email Form - partially animated */}
                {!submitted ? (
                    <form onSubmit={handleSubmit} className="space-y-3 max-w-xs mx-auto">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t.emailPlaceholder}
                            required
                            className="w-full px-4 py-3 rounded-full border border-slate-200 bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/10 focus:border-slate-300 shadow-sm text-sm transition-all"
                        />
                        <AnimatePresence mode="wait">
                            <motion.button
                                key={language + '-btn'}
                                type="submit"
                                disabled={submitting}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.15 }}
                                className="w-full py-3 rounded-full font-semibold text-sm text-white bg-illini-orange hover:bg-illini-orange/90 transition-colors shadow-md active:scale-[0.98] disabled:opacity-60"
                            >
                                {submitting ? (language === 'zh' ? '提交中…' : 'Submitting…') : t.notifyMe}
                            </motion.button>
                        </AnimatePresence>
                        {error && (
                            <p className="text-xs text-red-500 text-center">{error}</p>
                        )}
                    </form>
                ) : (
                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 max-w-xs mx-auto">
                        <span className="text-2xl mb-2 block">✅</span>
                        <p className="text-slate-600 text-sm font-medium">
                            {t.emailSuccess}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};
