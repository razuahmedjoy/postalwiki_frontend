import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface BostalStats {
    stats: number;
}

interface ImportProgress {
    currentFile: string | null;
    processed: number;
    total: number;
    upserted: number;
    modified: number;
    errors: Array<{ filename: string; error: string }>;
    isComplete: boolean;
    isRunning: boolean;
}



interface Botsol {
    _id: string;
    // Add Bostal-specific fields here based on your data structure
    // Example fields (adjust according to your actual Bostal data structure):
    company_name?: string;
    address?: string;
    date?: string;
    postcode?: string;
    email?: string;
    meta_description?: string;
    url?: string;
    statusCode?: string;
    redirect_url?: string;
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
    youtube?: string;
    is_blacklisted?: boolean;
    phone?: {
        number: string;
        areaName: string;
    }[];
    // Add more fields as needed
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
    data: Botsol[];
    pagination: PaginationResponse;
}

interface PaginatedBotsolParams {
    page?: number;
    limit?: number;
    searchUrl?: string;
    cursor?: string;
    useCursor?: string;
}

export const useBostalStats = () => {
    return useQuery({
        queryKey: ['botsol-stats'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<BostalStats>('/botsol/stats');
            return data.stats;
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
        refetchOnWindowFocus: false, // Don't refetch when window regains focus
        refetchOnMount: true, // Don't refetch when component mounts
    });
};

export const useBostalImport = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async () => {
            const { data } = await axiosInstance.post('/botsol/import');
            return data;
        },
        onSuccess: () => {
            // Invalidate stats query to refresh the count
            queryClient.invalidateQueries({ queryKey: ['botsol-stats'] });
        },
    });
};

export const useBostalImportProgress = () => {
    return useQuery({
        queryKey: ['botsol-import-progress'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<{ success: boolean; data: ImportProgress }>('/botsol/import-progress');
            return data;
        },
        enabled: false, // Don't run automatically, only when manually triggered
        refetchInterval: false, // Don't auto-refetch
    });
};



export const usePaginatedBotsol = (params: PaginatedBotsolParams) => {
    return useQuery({
        queryKey: ['botsol', params],
        queryFn: async () => {
            const { data } = await axiosInstance.get<PaginatedResponse>('/botsol/paginated', {
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
