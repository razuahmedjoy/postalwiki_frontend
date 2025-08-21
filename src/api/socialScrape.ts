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

interface SocialScrape {
    _id: string;
    url: string;
    date: string;
    title: string;
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    youtube: string;
    pinterest: string;
    email: string;
    phone: {
        number: string;
        areaName: string;
    }[];
    postcode: string;
    keywords: string;
    statusCode: string;
    redirect_url: string;
    meta_description: string;
    is_blacklisted: boolean;
}

// Union type for pagination response
type PaginationResponse = 
    | {
        // Traditional pagination
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }
    | {
        // Cursor-based pagination
        hasNextPage: boolean;
        nextCursor: string | null;
        limit: number;
    };

interface PaginatedResponse {
    success: boolean;
    data: SocialScrape[];
    pagination: PaginationResponse;
}

interface PaginatedParams {
    page?: number;
    limit: number;
    searchUrl?: string;
    cursor?: string;
    useCursor?: string;
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
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: true, // Don't refetch when component mounts
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

export const usePaginatedSocialScrapes = (params: PaginatedParams) => {
    return useQuery({
        queryKey: ['social-scrapes', params],
        queryFn: async () => {
            const { data } = await axiosInstance.get<PaginatedResponse>('/social-scrape/paginated', {
                params,
            });
            return data;
        },
        staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
        gcTime: 1 * 60 * 1000, // Keep data in cache for 1 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: true, // Don't refetch when component mounts
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    });
};

export const useUpdateBlacklist = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (urlColumn?: number) => {
            const response = await axiosInstance.post('/social-scrape/update-blacklist', {
                urlColumn: urlColumn || 2
            });
            return response.data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['socialScrapeStats'] });
        }
    });
}; 

export const useBlacklistedCount = () => {
    return useQuery({
        queryKey: ['blacklistedCount'],
        queryFn: async () => {
            const response = await axiosInstance.get('/social-scrape/blacklisted/count');
            return response.data;
        },
        staleTime: 30000, // 30 seconds
        refetchInterval: 30000, // Refetch every 30 seconds
    });
}; 