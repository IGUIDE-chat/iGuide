/**
 * @file ./src/components/ProfileScreen.tsx
 * @description Global Shared Component / Module
 * @description_zh 此文件不属于特定业务流，而是全局共享逻辑，只能包含与其他业务解耦的代码。如果该文件只为一个特定业务服务，请将其移动到对应的 src/components/<feature>/ 目录下。
 * @rules See docs/FILE_RULES.md. Follow the Colocation Principle.
 */

// [PAGE] User profile management and settings.
// [页面] 用户个人资料管理和设置页面。
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UI_TEXT } from '../i18n/uiText';
import { Language } from '../types';

interface ProfileScreenProps {
    language: Language;
    onBack: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ language, onBack }) => {
    const { user, logout, updateName } = useAuth();
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [newName, setNewName] = useState(user?.name || '');
    const [isLoading, setIsLoading] = useState(false);

    const t = {
        en: {
            profile: 'Profile',
            signOut: 'Sign Out',
            email: 'Email',
            account: 'Account',
            back: 'Back',
            confirmSignOut: 'Are you sure you want to sign out?',
            cancel: 'Cancel',
            nickname: 'Nickname',
            edit: 'Edit',
            save: 'Save',
            saving: 'Saving...'
        },
        zh: {
            profile: '个人资料',
            signOut: '退出登录',
            email: '邮箱',
            account: '账户',
            back: '返回',
            confirmSignOut: '确定要退出登录吗?',
            cancel: '取消',
            nickname: '昵称',
            edit: '修改',
            save: '保存',
            saving: '保存中...'
        }
    }[language];

    const handleSignOut = async () => {
        if (confirm(t.confirmSignOut)) {
            await logout();
            navigate('/');
        }
    };

    const handleUpdateName = async () => {
        if (!newName.trim() || newName === user?.name) {
            setIsEditing(false);
            return;
        }
        setIsLoading(true);
        const success = await updateName(newName);
        setIsLoading(false);
        if (success) {
            setIsEditing(false);
        } else {
            alert('Failed to update name. Please try again.');
        }
    };

    if (!user) return null;

    return (
        <div className="h-full w-full bg-white overflow-y-auto">
            <div className="max-w-md mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center mb-8 gap-4">
                    <button
                        onClick={onBack}
                        className="p-2 -ml-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold text-slate-900">{t.profile}</h1>
                </div>

                {/* Profile Card */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6">
                    <div className="flex flex-col items-center">
                        <div className="w-24 h-24 rounded-full bg-illini-orange flex items-center justify-center text-white text-4xl font-bold mb-4 shadow-lg shadow-illini-orange/20">
                            {user.name?.charAt(0).toUpperCase() || 'U'}
                        </div>

                        {isEditing ? (
                            <div className="flex items-center gap-2 mb-2 w-full max-w-[200px]">
                                <input
                                    type="text"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full px-3 py-1 text-center font-bold text-slate-900 border-b-2 border-illini-orange focus:outline-none bg-transparent"
                                    autoFocus
                                />
                            </div>
                        ) : (
                            <h2 className="text-xl font-bold text-slate-900 mb-1 flex items-center gap-2">
                                {user.name || 'User'}
                                <button onClick={() => { setIsEditing(true); setNewName(user.name); }} className="text-slate-400 hover:text-illini-blue">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                    </svg>
                                </button>
                            </h2>
                        )}

                        <p className="text-slate-500 text-sm">{user.email}</p>

                        {isEditing && (
                            <div className="flex gap-2 mt-4">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-1.5 text-xs font-medium text-slate-500 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"
                                >
                                    {t.cancel}
                                </button>
                                <button
                                    onClick={handleUpdateName}
                                    disabled={isLoading}
                                    className="px-4 py-1.5 text-xs font-medium text-white bg-illini-orange rounded-full hover:bg-illini-blue transition-colors disabled:opacity-50"
                                >
                                    {isLoading ? t.saving : t.save}
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="mt-8 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{t.email}</label>
                            <div className="p-3 bg-slate-50 rounded-lg text-slate-700 text-sm font-medium border border-slate-100">
                                {user.email}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <button
                    onClick={handleSignOut}
                    className="w-full py-3.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold transition-colors flex items-center justify-center gap-2 group"
                >
                    <svg className="w-5 h-5 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    {t.signOut}
                </button>
            </div>
        </div>
    );
};
