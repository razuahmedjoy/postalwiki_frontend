import { useMutation, useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface SSUrlCollection {
    collectionName: string;
    totalCount: number;
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



