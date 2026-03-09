// [LEGACY/UNUSED] Old context file. See src/contexts/AuthContext.tsx.
// [遗留/未使用] 旧的上下文文件。请参考 src/contexts/AuthContext.tsx。
import { createContext, useContext, useState, useEffect, ReactNode, FC } from 'react';
import { User, AuthContextType } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider: FC<AuthProviderProps> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Load user from localStorage on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('uiuc_kb_user');
        if (storedUser) {
            try {
                setUser(JSON.parse(storedUser));
            } catch (e) {
                localStorage.removeItem('uiuc_kb_user');
            }
        }
        setIsLoading(false);
    }, []);

    const login = async (email: string, password: string): Promise<boolean> => {
        setIsLoading(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check if user exists in localStorage
        const usersData = localStorage.getItem('uiuc_kb_users');
        const users = usersData ? JSON.parse(usersData) : [];

        const foundUser = users.find((u: any) => u.email === email && u.password === password);

        if (foundUser) {
            const { password: _, ...userWithoutPassword } = foundUser;
            setUser({ ...userWithoutPassword, isAdmin: false });
            localStorage.setItem('uiuc_kb_user', JSON.stringify(userWithoutPassword));
            setIsLoading(false);
            return true;
        }

        setIsLoading(false);
        return false;
    };

    const register = async (name: string, email: string, password: string): Promise<boolean> => {
        setIsLoading(true);

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Check if user already exists
        const usersData = localStorage.getItem('uiuc_kb_users');
        const users = usersData ? JSON.parse(usersData) : [];

        if (users.find((u: any) => u.email === email)) {
            setIsLoading(false);
            return false; // User already exists
        }

        // Create new user
        const newUser = {
            id: Date.now().toString(),
            name,
            email,
            password // In production, this should be hashed!
        };

        users.push(newUser);
        localStorage.setItem('uiuc_kb_users', JSON.stringify(users));

        // Auto-login after registration
        const { password: _, ...userWithoutPassword } = newUser;
        const userRecord = { ...userWithoutPassword, isAdmin: false };
        setUser(userRecord);
        localStorage.setItem('uiuc_kb_user', JSON.stringify(userRecord));

        setIsLoading(false);
        return true;
        setIsLoading(false);
        return true;
    };

    const loginWithGoogle = async (): Promise<boolean> => {
        // TODO: Implement actual Google Login
        console.warn('Google Login not yet implemented');
        return false;
    };

    const loginWithMicrosoft = async (): Promise<boolean> => {
        // Keep the legacy provider type-complete even though this file is unused.
        console.warn('Microsoft Login not yet implemented');
        return false;
    };

    const updateName = async (name: string): Promise<boolean> => {
        if (!user) return false;

        const updatedUser = { ...user, name };
        setUser(updatedUser);
        localStorage.setItem('uiuc_kb_user', JSON.stringify(updatedUser));

        // Update in users list as well
        const usersData = localStorage.getItem('uiuc_kb_users');
        if (usersData) {
            const users = JSON.parse(usersData);
            const userIndex = users.findIndex((u: any) => u.email === user.email);
            if (userIndex !== -1) {
                users[userIndex].name = name;
                localStorage.setItem('uiuc_kb_users', JSON.stringify(users));
            }
        }
        return true;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('uiuc_kb_user');
    };

    return (
        <AuthContext.Provider
            value={{ user, login, register, logout, loginWithGoogle, loginWithMicrosoft, updateName, isLoading }}
        >
            {children}
        </AuthContext.Provider>
    );
};
