import * as React from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { UI_TEXT } from '../constants';
import { Language } from '../types';

interface LoginScreenProps {
    onGuestLogin?: () => void;
    language: Language;
    onLanguageChange: (lang: Language) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onGuestLogin, language, onLanguageChange }) => {
    const { login, register, loginWithGoogle } = useAuth();
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
        <div className="min-h-screen flex items-start justify-center pt-32 bg-gradient-to-br from-illini-blue/10 via-white to-illini-orange/10 overflow-y-auto relative">
            {/* Language Switcher - Fixed Position */}
            <div className="absolute top-8 right-8 z-50">
                <button
                    onClick={() => onLanguageChange(language === 'en' ? 'zh' : 'en')}
                    className="bg-white/80 backdrop-blur-md px-4 py-2.5 rounded-full shadow-sm border border-slate-200 text-sm font-semibold text-slate-600 hover:text-illini-blue hover:border-illini-blue/30 transition-all flex items-center gap-2"
                >
                    <span>{language === 'en' ? '🌏 中文' : '🌏 English'}</span>
                </button>
            </div>

            <motion.div
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl border border-slate-100"
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
                    className="w-full mb-6 py-3 px-4 border border-slate-200 rounded-xl flex items-center justify-center gap-3 text-slate-700 font-medium hover:bg-slate-50 hover:border-slate-300 transition-all group"
                >
                    <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 opacity-70 group-hover:opacity-100 transition-opacity" />
                    {t.googleLogin}
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
