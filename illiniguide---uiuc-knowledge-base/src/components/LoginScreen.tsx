/**
 * @file ./src/components/LoginScreen.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [PAGE] Combined login/registration screen with guest mode support.
// [页面] 集成了访客模式支持的登录/注册页面。
import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UI_TEXT } from '../i18n/uiText';
import { Language } from '../types';

interface LoginScreenProps {
    onGuestLogin?: () => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGuestLogin, language, onLanguageChange }) => {
    const { login, register, loginWithGoogle, loginWithMicrosoft } = useAuth();
    const t = UI_TEXT[language];

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            let success = false;
            if (isLogin) {
                success = await login(email, password);
            } else {
                // Use email prefix as default name
                const defaultName = email.split('@')[0];
                success = await register(defaultName, email, password);
            }

            if (!success) {
                setError(isLogin ? t.loginError : t.registerError);
            }
        } catch (err) {
            setError(t.genericError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-start justify-center pt-16 md:pt-32 bg-gradient-to-br from-illini-blue/10 via-white to-illini-orange/10 overflow-y-auto relative px-4">
            {/* Language Switcher - Responsive Position */}
            <div className="absolute top-4 right-4 md:top-8 md:right-8 z-50">
                <button
                    onClick={() => onLanguageChange(language === 'en' ? 'zh' : 'en')}
                    className="bg-white/80 backdrop-blur-md px-3 py-2 md:px-4 md:py-2.5 rounded-full shadow-sm border border-slate-200 text-sm font-semibold text-slate-600 hover:text-illini-blue hover:border-illini-blue/30 transition-all flex items-center gap-2"
                >
                    <span>{language === 'en' ? '🌏 中文' : '🌏 English'}</span>
                </button>
            </div>

            <motion.div
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-md p-6 md:p-8 bg-white rounded-3xl shadow-2xl border border-slate-100"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        {t.loginTitle}
                    </h1>
                    <p className="text-slate-500">{t.loginSubtitle}</p>
                </div>

                {/* Toggle */}
                <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-full relative isolate">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 px-4 rounded-full font-medium transition-colors relative z-10 ${isLogin ? 'text-illini-blue' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        {isLogin && (
                            <motion.div
                                layoutId="active-pill"
                                className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        {t.loginSwitch}
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 px-4 rounded-full font-medium transition-colors relative z-10 ${!isLogin ? 'text-illini-blue' : 'text-slate-500 hover:text-slate-900'
                            }`}
                    >
                        {!isLogin && (
                            <motion.div
                                layoutId="active-pill"
                                className="absolute inset-0 bg-white rounded-full shadow-sm -z-10"
                                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            />
                        )}
                        {t.registerSwitch}
                    </button>
                </div>

                {/* Google Login */}
                <button
                    onClick={() => loginWithGoogle()}
                    className="w-full mb-3 py-3 px-4 border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all group"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    {t.googleLogin}
                </button>

                {/* Microsoft Login */}
                <button
                    onClick={() => loginWithMicrosoft()}
                    className="w-full mb-6 py-3 px-4 border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all group"
                >
                    <svg className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" viewBox="0 0 21 21" xmlns="http://www.w3.org/2000/svg">
                        <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                        <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                        <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                        <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
                    </svg>
                    {t.microsoftLogin}
                </button>

                <div className="relative mb-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-slate-100"></div>
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-slate-400">{t.orEmail}</span>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                            {t.emailLabel}
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-illini-blue/10 focus:border-illini-blue transition-all"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 ml-1">
                            {t.passwordLabel}
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:ring-4 focus:ring-illini-blue/10 focus:border-illini-blue transition-all"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm flex items-center gap-2">
                            <span>⚠️</span> {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3.5 bg-illini-blue text-white font-bold text-lg rounded-xl shadow-lg shadow-illini-blue/20 hover:bg-illini-blue/90 hover:shadow-xl hover:shadow-illini-blue/30 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                    >
                        {loading ? t.processing : isLogin ? t.loginAction : t.registerAction}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-slate-500">
                    {isLogin ? t.noAccount : t.hasAccount}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="ml-1 text-illini-blue font-medium hover:underline"
                    >
                        {isLogin ? t.registerNow : t.loginNow}
                    </button>
                </div>

                {/* Guest Mode Link */}
                <div className="mt-4 pt-4 border-t border-slate-100/80 text-center">
                    <button
                        onClick={onGuestLogin}
                        className="text-slate-400 hover:text-slate-600 text-xs transition-colors hover:underline"
                    >
                        {t.guestMode}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
