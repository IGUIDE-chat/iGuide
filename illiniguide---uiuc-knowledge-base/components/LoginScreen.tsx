import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const LoginScreen: React.FC = () => {
    const { login, register } = useAuth();
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
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
                if (!name.trim()) {
                    setError('请输入姓名');
                    setLoading(false);
                    return;
                }
                success = await register(name, email, password);
            }

            if (!success) {
                setError(isLogin ? '登录失败，请检查邮箱和密码' : '注册失败，请稍后重试');
            }
        } catch (err) {
            setError('发生错误，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-illini-blue/10 via-white to-illini-orange/10">
            <div className="w-full max-w-md p-8 bg-white rounded-3xl shadow-2xl border border-slate-100">
                {/* Logo */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-slate-900 mb-2">
                        伊利诺伊指南
                    </h1>
                    <p className="text-slate-500">UIUC 新生知识库</p>
                </div>

                {/* Toggle */}
                <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-full">
                    <button
                        onClick={() => setIsLogin(true)}
                        className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${isLogin
                                ? 'bg-white text-illini-blue shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        登录
                    </button>
                    <button
                        onClick={() => setIsLogin(false)}
                        className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${!isLogin
                                ? 'bg-white text-illini-blue shadow-sm'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                    >
                        注册
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                姓名
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-illini-blue/20 focus:border-illini-blue transition-all"
                                placeholder="请输入姓名"
                                required={!isLogin}
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            邮箱
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-illini-blue/20 focus:border-illini-blue transition-all"
                            placeholder="your@email.com"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                            密码
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-illini-blue/20 focus:border-illini-blue transition-all"
                            placeholder="••••••••"
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-illini-blue to-illini-orange text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-illini-blue/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? '处理中...' : isLogin ? '登录' : '注册'}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center text-sm text-slate-500">
                    {isLogin ? '还没有账号？' : '已有账号？'}
                    <button
                        onClick={() => {
                            setIsLogin(!isLogin);
                            setError('');
                        }}
                        className="ml-1 text-illini-blue font-medium hover:underline"
                    >
                        {isLogin ? '立即注册' : '立即登录'}
                    </button>
                </div>
            </div>
        </div>
    );
};
