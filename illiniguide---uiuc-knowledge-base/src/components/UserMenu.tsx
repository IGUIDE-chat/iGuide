import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const UserMenu: React.FC = () => {
    const { user, logout } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    if (!user) return null;

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 rounded-full hover:bg-slate-100 transition-colors"
            >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-illini-blue to-illini-orange flex items-center justify-center text-white font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm font-medium text-slate-700 hidden sm:block">
                    {user.name}
                </span>
            </button>

            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-10"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Menu */}
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-20 overflow-hidden">
                        <div className="p-4 border-b border-slate-100">
                            <p className="font-semibold text-slate-900">{user.name}</p>
                            <p className="text-sm text-slate-500 truncate">{user.email}</p>
                        </div>

                        <div className="p-2">
                            <button
                                onClick={() => {
                                    logout();
                                    setIsOpen(false);
                                }}
                                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                            >
                                登出
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
