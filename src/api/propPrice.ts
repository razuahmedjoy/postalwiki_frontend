import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface PropPriceStats {
  propPriceCount: number;
}

interface PropPriceProgress {
  currentFile: string | null;
  processed: number;
  total: number;
  upserted: number;
  modified: number;
  skipped?: number;
  skippedSamples?: Array<{ filename: string; reason: string; rowPreview: string }>;
  errors: Array<{ filename: string; error: string }>;
  isComplete: boolean;
  isRunning: boolean;
}

export interface PropPriceImportFile {
  filename: string;
  sizeBytes: number;
  lastModified: string;
  status: 'pending';
}

interface PropPriceImportFilesResponse {
  files: PropPriceImportFile[];
  pendingCount: number;
  importEnabled: boolean;
}

export interface PropPriceRow {
  _id: string;
  unique_id: string;
  price_paid: number;
  deed_date: string;
  postcode: string;
  address_display: string;
  deed_date_display: string;
  price_paid_display: string;
  saon?: string;
  paon?: string;
  street?: string;
}

interface PaginatedResponse {
  success: boolean;
  data: PropPriceRow[];
  pagination: {
    mode?: 'cursor';
    page: number | null;
    limit: number;
    total: number | null;
    totalPages: number | null;
    hasNextPage?: boolean;
    nextCursor?: string | null;
  };
}

interface PaginatedParams {
  searchPostcode?: string;
  limit?: number;
  cursor?: string | null;
}

interface UploadPropPriceFilesPayload {
  file: File;
  onProgress?: (percent: number) => void;
}

export const usePropPriceStats = () => {
  return useQuery({
    queryKey: ['prop-price-stats'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ success: boolean; stats: PropPriceStats }>('/prop-price/stats');
      return data.stats;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const usePropPriceImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post('/prop-price/import');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prop-price-stats'] });
      queryClient.invalidateQueries({ queryKey: ['prop-price-import-progress'] });
    }
  });
};

export const usePropPriceImportFiles = () => {
  return useQuery({
    queryKey: ['prop-price-import-files'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ success: boolean; data: PropPriceImportFilesResponse }>('/prop-price/import-files');
      return data.data;
    },
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
};

export const useUploadPropPriceFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, onProgress }: UploadPropPriceFilesPayload) => {
      const formData = new FormData();
      formData.append('files', file);

      const { data } = await axiosInstance.post('/prop-price/upload-files', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (event) => {
          if (!event.total || !onProgress) return;
          const percent = Math.round((event.loaded * 100) / event.total);
          onProgress(percent);
        },
      });

      return data;
    },
    onSuccess: (response) => {
      if (response?.data) {
        queryClient.setQueryData(['prop-price-import-files'], response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['prop-price-import-files'] });
    }
  });
};

export const usePropPriceImportProgress = () => {
  return useQuery({
    queryKey: ['prop-price-import-progress'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ success: boolean; data: PropPriceProgress }>('/prop-price/import-progress');
      return data.data;
    },
    refetchInterval: 2000,
    enabled: true,
  });
};

export const useStopPropPriceImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post('/prop-price/stop-import');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['prop-price-import-progress'] });
    }
  });
};

export const usePaginatedPropPrice = (params: PaginatedParams) => {
  return useQuery({
    queryKey: ['prop-price-paginated', params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginatedResponse>('/prop-price/paginated', {
        params,
      });
      return data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
