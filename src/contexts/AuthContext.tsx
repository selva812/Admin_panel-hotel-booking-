"use client";
import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

type User = {
    id: number;
    name: string;
    token: string;
    role: string
};

type AuthContextType = {
    user: Omit<User, 'token'> | null;
    isLoading: boolean; // Add loading state
    loginApi: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<Omit<User, 'token'> | null>(null);
    const [isLoading, setIsLoading] = useState(true); // Start with loading true

    // Load user from localStorage on mount
    useEffect(() => {
        const initAuth = () => {
            try {
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    setUser(JSON.parse(storedUser));
                }
            } catch (error) {
                console.error('Error loading user from localStorage:', error);
                // Clear corrupted data
                localStorage.removeItem('user');
                localStorage.removeItem('token');
            } finally {
                setIsLoading(false); // Set loading to false after checking
            }
        };

        initAuth();
    }, []);

    const loginApi = async (email: string, password: string) => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ emailOrUsername: email, password }),
            });
            const data = await response.json();
            if (response.ok) {
                console.log(data.user)
                const userData = {
                    id: data.user.id,
                    name: data.user.name,
                    role: data.user.role ? 'ADMIN' : 'STAFF',
                };
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                localStorage.setItem('token', data.token);
            } else {
                console.error('Login failed:', data.message);
                throw new Error(data.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login failed:', error);
            throw error;
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout API failed:', error);
        } finally {
            setUser(null);
            localStorage.removeItem('user');
            localStorage.removeItem('token');
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, loginApi, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
