import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

export interface PostcodeDistrict {
    _id: string;
    postcode: string;
    district: string;
}

interface ImportJobStatus {
    _id: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    totalProcessed: number;
    insertedCount: number;
    errorCount: number;
    errorLogs: string[];
    createdAt: string;
}

interface SearchParams {
    postcode?: string;
    district?: string;
    page: number;
    limit: number;
}

interface SearchResponse {
    success: boolean;
    count: number;
    total: number;
    page: number;
    totalPages: number;
    data: PostcodeDistrict[];
}

interface CreateParams {
    postcode: string;
    district: string;
}

interface UpdateParams {
    id: string;
    district: string;
}

// --- Import Hooks ---

export const usePostcodeImportStart = () => {
    return useMutation({
        mutationFn: async () => {
            const { data } = await axiosInstance.post<{ jobId: string }>('/postcode-district/import/start');
            return data;
        },
    });
};

export const usePostcodeUpload = () => {
    return useMutation({
        mutationFn: async ({ jobId, file, onUploadProgress }: { jobId: string; file: File; onUploadProgress?: (progressEvent: any) => void }) => {
            const formData = new FormData();
            formData.append('file', file);

            const { data } = await axiosInstance.post(`/postcode-district/import/upload/${jobId}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress,
                timeout: 300000
            });
            return data;
        },
    });
};

export const usePostcodeImportStatus = (jobId: string | null) => {
    return useQuery({
        queryKey: ['postcode-import-status', jobId],
        queryFn: async () => {
            if (!jobId) return null;
            const { data } = await axiosInstance.get<ImportJobStatus>(`/postcode-district/import/status/${jobId}`);
            return data;
        },
        enabled: !!jobId,
        refetchInterval: (query) => {
            const status = query.state.data?.status;
            if (status === 'completed' || status === 'failed') return false;
            return 2000;
        }
    });
};

// --- Search & CRUD Hooks ---

export const usePostcodeSearch = (params: SearchParams) => {
    return useQuery({
        queryKey: ['postcode-search', params],
        queryFn: async () => {
            const { data } = await axiosInstance.post<SearchResponse>('/postcode-district/search', params);
            return data;
        },
        staleTime: 5 * 60 * 1000,
        placeholderData: (previousData) => previousData,
    });
};

export const usePostcodeCreate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (params: CreateParams) => {
            const { data } = await axiosInstance.post('/postcode-district/create', params);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['postcode-search'] });
        }
    });
};

export const usePostcodeUpdate = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({ id, district }: UpdateParams) => {
            const { data } = await axiosInstance.put(`/postcode-district/${id}`, { district });
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['postcode-search'] });
        }
    });
};

export const usePostcodeDelete = () => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (id: string) => {
            const { data } = await axiosInstance.delete(`/postcode-district/${id}`);
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['postcode-search'] });
        }
    });
};
