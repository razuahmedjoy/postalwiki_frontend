import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    username: string;
    email?: string;
    role?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    setUser: (user: User | null) => void;
    setToken: (token: string | null) => void;
    logout: () => void;
    initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            setUser: (user) => set({ user, isAuthenticated: !!user }),
            setToken: (token) => set({ token }),
            logout: () => {
                set({ user: null, token: null, isAuthenticated: false });
            },
            initialize: () => {
                const stored = localStorage.getItem('auth-storage');
                if (stored) {
                    try {
                        const { state } = JSON.parse(stored);
                        if (state.token) {
                            set({ token: state.token, isAuthenticated: true });
                        }
                    } catch (error) {
                        console.error('Failed to parse auth storage:', error);
                    }
                }
            }
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({ token: state.token }),
        }
    )
); 