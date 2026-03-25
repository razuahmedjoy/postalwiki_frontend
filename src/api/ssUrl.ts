import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface SSUrlCollection {
    collectionName: string;
    totalCount: number;
}

export interface SSUrlRecord {
    _id: string;
    url: string;
    image: string;
}

export interface SSUrlSearchParams {
    url?: string;
    image?: string;
    page: number;
    limit: number;
}

export interface SSUrlSearchResponse {
    success: boolean;
    count: number;
    total: number;
    page: number;
    totalPages: number;
    data: SSUrlRecord[];
}

export const useSSUrlCollections = () => {
    return useQuery({
        queryKey: ['ss-url-count'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<SSUrlCollection>('/ss-url/count');
            return data;
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    });
};

export const useSSUrlSearch = (params: SSUrlSearchParams) => {
    return useQuery({
        queryKey: ['ss-url-search', params],
        queryFn: async () => {
            const { data } = await axiosInstance.post<SSUrlSearchResponse>('/ss-url/search', params);
            return data;
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
};



