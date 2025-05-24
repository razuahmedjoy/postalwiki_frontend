import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface SocialScrapeStats {
    stats: number;
}

interface ImportProgress {
    type: 'batchComplete' | 'error';
    filename: string;
    processed?: number;
    total?: number;
    upserted?: number;
    modified?: number;
    error?: string;
}

export const useSocialScrapeStats = () => {
    return useQuery({
        queryKey: ['social-scrape-stats'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<SocialScrapeStats>('/social-scrape/stats');
            return data.stats;
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
    });
};

export const useSocialScrapeImport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await axiosInstance.post('/social-scrape/import');
            return data;
        },

    });
}; 