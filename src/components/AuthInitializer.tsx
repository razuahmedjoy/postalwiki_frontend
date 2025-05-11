import { useEffect } from 'react';
import { useAuthStore } from '@/store/auth';
import { useGetMe } from '@/api/auth';

export function AuthInitializer() {
    const initialize = useAuthStore(state => state.initialize);
    const { isLoading, isError } = useGetMe();

    useEffect(() => {
        initialize();
    }, [initialize]);

    // If there's an error fetching user data, clear the auth state
    useEffect(() => {
        if (isError) {
            useAuthStore.getState().logout();
        }
    }, [isError]);

    return null;
} 