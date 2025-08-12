import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { AdultKeywordsProgress, AdultKeywordsStats, AdultKeywordsReference } from '@/types/adultKeywords';

// Response types
interface PaginatedReferencesResponse {
    success: boolean;
    data: {
        references: AdultKeywordsReference[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    };
}

interface StartMatchingResponse {
    success: boolean;
    message: string;
    files: string[];
}

interface StopMatchingResponse {
    success: boolean;
    message: string;
}

// API Hooks
export const useAdultKeywordsProgress = (enabled: boolean = false) => {
    return useQuery({
        queryKey: ['adult-keywords-progress'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<{ success: boolean; progress: AdultKeywordsProgress }>('/adult-keywords/matching-progress');
            return data.progress;
        },
        staleTime: 1000, // Consider data fresh for 1 second (real-time updates)
        gcTime: 5 * 60 * 1000, // Keep data in cache for 5 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        refetchInterval: enabled ? 2000 : false, // Only poll when enabled
        enabled: enabled, // Only run query when enabled
    });
};

export const useAdultKeywordsStats = () => {
    return useQuery({
        queryKey: ['adult-keywords-stats'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<{ success: boolean; stats: AdultKeywordsStats }>('/adult-keywords/stats');
            return data.stats;
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
        gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });
};

export const useAdultKeywordsReferences = () => {
    return useQuery({
        queryKey: ['adult-keywords-references'],
        queryFn: async () => {
            const { data } = await axiosInstance.get<{ success: boolean; references: AdultKeywordsReference[] }>('/adult-keywords/references');
            return data.references;
        },
        staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
        gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
    });
};

export const usePaginatedAdultKeywordsReferences = (page: number = 1, limit: number = 50, matchType?: string, processed?: boolean) => {
    return useQuery({
        queryKey: ['adult-keywords-references-paginated', page, limit, matchType, processed],
        queryFn: async () => {
            const params: Record<string, string | number | boolean> = { page, limit };
            if (matchType) params.matchType = matchType;
            if (processed !== undefined) params.processed = processed;
            
            const { data } = await axiosInstance.get<PaginatedReferencesResponse>('/adult-keywords/references/paginated', {
                params,
            });
            return data.data;
        },
        staleTime: 2 * 60 * 1000, // Consider data fresh for 2 minutes
        gcTime: 10 * 60 * 1000, // Keep data in cache for 10 minutes
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        placeholderData: (previousData) => previousData, // Keep previous data while fetching new data
    });
};

export const useStartAdultKeywordsMatching = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (): Promise<StartMatchingResponse> => {
            const { data } = await axiosInstance.post<StartMatchingResponse>('/adult-keywords/start-matching');
            return data;
        },
        onSuccess: () => {
            // Invalidate and refetch progress and stats
            queryClient.invalidateQueries({ queryKey: ['adult-keywords-progress'] });
            queryClient.invalidateQueries({ queryKey: ['adult-keywords-stats'] });
            
            // Trigger a one-time fetch to get initial progress
            queryClient.refetchQueries({ queryKey: ['adult-keywords-progress'] });
        },
        onError: (error) => {
            console.error('Failed to start adult keywords matching:', error);
        }
    });
};

export const useStopAdultKeywordsMatching = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async (): Promise<StopMatchingResponse> => {
            const { data } = await axiosInstance.post<StopMatchingResponse>('/adult-keywords/stop-matching');
            return data;
        },
        onSuccess: () => {
            // Invalidate and refetch progress and stats
            queryClient.invalidateQueries({ queryKey: ['adult-keywords-progress'] });
            queryClient.invalidateQueries({ queryKey: ['adult-keywords-stats'] });
            
            // Trigger a one-time fetch to get final progress
            queryClient.refetchQueries({ queryKey: ['adult-keywords-progress'] });
        },
        onError: (error) => {
            console.error('Failed to stop adult keywords matching:', error);
        }
    });
};

export const useBulkProcessReferences = () => {
    const queryClient = useQueryClient();
    
    return useMutation({
        mutationFn: async ({ recordIds, isAdultContent }: { recordIds: string[], isAdultContent: boolean }) => {
            const { data } = await axiosInstance.post('/adult-keywords/references/bulk-process', {
                recordIds,
                isAdultContent
            });
            return data;
        },
        onSuccess: () => {
            // Invalidate and refetch references and stats
            queryClient.invalidateQueries({ queryKey: ['adult-keywords-references'] });
            queryClient.invalidateQueries({ queryKey: ['adult-keywords-references-paginated'] });
            queryClient.invalidateQueries({ queryKey: ['adult-keywords-stats'] });
        },
        onError: (error) => {
            console.error('Failed to bulk process references:', error);
        }
    });
};

// Utility function to format progress percentage
export const getProgressPercentage = (progress: AdultKeywordsProgress): number => {
    if (progress.total === 0) return 0;
    return Math.round((progress.processed / progress.total) * 100);
};

// Utility function to get status text
export const getStatusText = (progress: AdultKeywordsProgress): string => {
    if (progress.isRunning) {
        if (progress.currentFile) {
            return `Processing: ${progress.currentFile}`;
        }
        return 'Starting...';
    }
    
    if (progress.isComplete) {
        return 'Completed';
    }
    
    return 'Idle';
};

// Utility function to get status color
export const getStatusColor = (progress: AdultKeywordsProgress): string => {
    if (progress.isRunning) return 'text-white';
    if (progress.isComplete) return 'text-green-600';
    return 'text-gray-600';
}; 