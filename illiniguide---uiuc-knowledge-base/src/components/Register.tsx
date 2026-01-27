// [LEGACY/UNUSED] Old register component. Replaced by LoginScreen.tsx.
// [遗留/未使用] 旧的注册组件。已被 LoginScreen.tsx 取代。
import React, { useState } from 'react';
import { useAuth } from './AuthContext';

interface RegisterProps {
    onSwitchToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSwitchToLogin }) => {
    const { register, isLoading } = useAuth();
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        if (!acceptTerms) {
            setError('Please accept the terms of service');
            return;
        }

        const success = await register(name, email, password);
        if (!success) {
            setError('Email already registered');
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-illini-blue via-slate-800 to-illini-orange/20 flex items-center justify-center p-4">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-20 w-96 h-96 bg-illini-orange/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-illini-blue/10 rounded-full blur-3xl"></div>
            </div>

            <div className="w-full max-w-md relative">
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">IlliniGuide</h1>
                    <p className="text-slate-300 text-sm">UIUC Knowledge Base</p>
                </div>

                {/* Register Card */}
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 border border-white/20">
                    <h2 className="text-2xl font-bold text-slate-900 mb-6">Create Account</h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field */}
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                                Full Name
                            </label>
                            <input
                                id="name"
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/50 focus:border-illini-blue transition-all"
                                placeholder="John Doe"
                                autoFocus
                            />
                        </div>

                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                                Email Address
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/50 focus:border-illini-blue transition-all"
                                placeholder="your.email@illinois.edu"
                            />
                        </div>

                        {/* Password Field */}
                        <div>
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/50 focus:border-illini-blue transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-2">
                                Confirm Password
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-illini-blue/50 focus:border-illini-blue transition-all"
                                placeholder="••••••••"
                            />
                        </div>

                        {/* Terms Checkbox */}
                        <div className="flex items-start">
                            <input
                                id="terms"
                                type="checkbox"
                                checked={acceptTerms}
                                onChange={(e) => setAcceptTerms(e.target.checked)}
                                className="w-4 h-4 mt-1 text-illini-blue bg-slate-50 border-slate-300 rounded focus:ring-illini-blue/50"
                            />
                            <label htmlFor="terms" className="ml-2 text-sm text-slate-600">
                                I agree to the{' '}
                                <span className="text-illini-blue hover:underline cursor-pointer">
                                    Terms of Service
                                </span>{' '}
                                and{' '}
                                <span className="text-illini-blue hover:underline cursor-pointer">
                                    Privacy Policy
                                </span>
                            </label>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                                {error}
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-illini-orange hover:bg-illini-orange/90 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Account'
                            )}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-slate-600">
                            Already have an account?{' '}
                            <button
                                onClick={onSwitchToLogin}
                                className="text-illini-blue hover:text-illini-blue/80 font-semibold transition-colors"
                            >
                                Sign In
                            </button>
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center mt-6">
                    <p className="text-slate-400 text-xs">
                        © 2026 IlliniGuide. For UIUC students, by UIUC students.
                    </p>
                </div>
            </div>
        </div>
    );
};
