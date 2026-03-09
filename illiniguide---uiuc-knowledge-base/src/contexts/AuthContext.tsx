// [CONTEXT] Authentication provider managing user login state and session persistence.
// [上下文] 管理用户登录状态和会话持久化的身份验证提供者。
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isGuest, setIsGuest] = useState(true);

    useEffect(() => {
        // Check current session
        checkUser();

        // Listen to auth changes
        const subscription = authService.onAuthStateChange((supabaseUser) => {
            if (supabaseUser) {
                setUser(convertSupabaseUser(supabaseUser));
            } else {
                setUser(null);
            }
            setIsLoading(false);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkUser = async () => {
        try {
            const supabaseUser = await authService.getCurrentUser();
            if (supabaseUser) {
                setUser(convertSupabaseUser(supabaseUser));
            }
        } catch (error) {
            console.error('Error checking user:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const convertSupabaseUser = (supabaseUser: SupabaseUser): User => {
        return {
            id: supabaseUser.id,
            name: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User',
            email: supabaseUser.email || '',
            isAdmin: supabaseUser.user_metadata?.is_admin === true
        };
    };

    const login = async (email: string, password: string): Promise<boolean> => {
        try {
            const { data, error } = await authService.signInWithEmail(email, password);
            if (error) {
                console.error('Login error:', error);
                return false;
            }
            if (data.user) {
                setUser(convertSupabaseUser(data.user));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Login exception:', error);
            return false;
        }
    };

    const register = async (name: string, email: string, password: string): Promise<boolean> => {
        try {
            const { data, error } = await authService.signUp(email, password, name);
            if (error) {
                console.error('Register error:', error);
                return false;
            }
            if (data.user) {
                setUser(convertSupabaseUser(data.user));
                return true;
            }
            return false;
        } catch (error) {
            console.error('Register exception:', error);
            return false;
        }
    };

    const logout = async () => {
        try {
            await authService.signOut();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const updateName = async (name: string): Promise<boolean> => {
        try {
            const { data, error } = await authService.updateUser({ data: { display_name: name } });
            if (error) {
                console.error('Update name error:', error);
                return false;
            }
            if (data.user) {
                setUser(prev => prev ? { ...prev, name } : null);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Update name exception:', error);
            return false;
        }
    };

    const loginWithGoogle = async () => {
        try {
            const { error } = await authService.signInWithGoogle();
            if (error) {
                console.error('Google login error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Google login exception:', error);
            return false;
        }
    };

    const loginWithMicrosoft = async () => {
        try {
            const { error } = await authService.signInWithMicrosoft();
            if (error) {
                console.error('Microsoft login error:', error);
                return false;
            }
            return true;
        } catch (error) {
            console.error('Microsoft login exception:', error);
            return false;
        }
    };

    const requestLogin = () => setIsGuest(false);

    const value: AuthContextType = {
        user,
        login,
        register,
        loginWithGoogle,
        loginWithMicrosoft,
        logout,
        updateName,
        isLoading,
        isGuest,
        setIsGuest,
        requestLogin
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
