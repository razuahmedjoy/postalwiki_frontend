import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { useAuthStore } from '@/store/auth';
import { useEffect } from 'react';

interface LoginCredentials {
    username: string;
    password: string;
}

interface LoginResponse {
    token: string;
    user: {
        id: string;
        username: string;
        email?: string;
        role?: string;
    };
}


export const useLogin = () => {
    const { setUser, setToken } = useAuthStore();

    return useMutation({
        mutationFn: async (credentials: LoginCredentials) => {
            
            const { data } = await axiosInstance.post<LoginResponse>('/login', credentials);
            
            return data;
        },
        onSuccess: (data) => {
        
            setToken(data.token);
            setUser(data.user);
        },
    });
};

export const useGetMe = () => {
    const { setUser, token } = useAuthStore();

    const query = useQuery({
        queryKey: ['me'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<LoginResponse['user']>('/me');
            return data;
        },
        enabled: !!token, // Only run the query if we have a token
        retry: false,
    });

    useEffect(() => {
        if (query.data) {
            setUser(query.data);
        }
    }, [query.data, setUser]);

    return query;
}; 