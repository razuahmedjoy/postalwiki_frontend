import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface RMAddressStats {
  addressMasterMergedCount: number;
}

interface RMAddressProgress {
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

export interface RMAddressImportFile {
  filename: string;
  sizeBytes: number;
  lastModified: string;
  status: 'pending';
}

interface RMAddressImportFilesResponse {
  files: RMAddressImportFile[];
  pendingCount: number;
  importEnabled: boolean;
}

export interface RMAddressRow {
  _id: string;
  postcode: string;
  district: string;
  address: string;
  dateCreated?: string;
  correctionVersion?: string;
  exceptionVersion?: string;
}

interface PaginatedResponse {
  success: boolean;
  data: RMAddressRow[];
  pagination: {
    mode?: 'cursor' | 'offset';
    page: number | null;
    limit: number;
    total: number | null;
    totalPages: number | null;
    hasNextPage?: boolean;
    nextCursor?: string | null;
  };
}

interface PaginatedParams {
  page?: number;
  limit?: number;
  cursor?: string | null;
  useCursor?: boolean;
  searchPostcode?: string;
  searchDistrict?: string;
  searchAddress?: string;
}

interface UploadRMAddressFilesPayload {
  file: File;
  onProgress?: (percent: number) => void;
}

export const useRMAddressStats = () => {
  return useQuery({
    queryKey: ['rm-address-stats'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ success: boolean; stats: RMAddressStats }>('/rm-address/stats');
      return data.stats;
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
};

export const useRMAddressImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post('/rm-address/import');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rm-address-stats'] });
      queryClient.invalidateQueries({ queryKey: ['rm-address-import-progress'] });
    }
  });
};

export const useRMAddressImportFiles = () => {
  return useQuery({
    queryKey: ['rm-address-import-files'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ success: boolean; data: RMAddressImportFilesResponse }>('/rm-address/import-files');
      return data.data;
    },
    staleTime: 5000,
    refetchOnWindowFocus: true,
  });
};

export const useUploadRMAddressFiles = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, onProgress }: UploadRMAddressFilesPayload) => {
      const formData = new FormData();
      formData.append('files', file);

      const { data } = await axiosInstance.post('/rm-address/upload-files', formData, {
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
        queryClient.setQueryData(['rm-address-import-files'], response.data);
      }
      queryClient.invalidateQueries({ queryKey: ['rm-address-import-files'] });
    }
  });
};

export const useRMAddressImportProgress = () => {
  return useQuery({
    queryKey: ['rm-address-import-progress'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ success: boolean; data: RMAddressProgress }>('/rm-address/import-progress');
      return data.data;
    },
    refetchInterval: 2000,
    enabled: true,
  });
};

export const useStopRMAddressImport = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await axiosInstance.post('/rm-address/stop-import');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rm-address-import-progress'] });
    }
  });
};

export const usePaginatedRMAddress = (params: PaginatedParams) => {
  return useQuery({
    queryKey: ['rm-address-paginated', params],
    queryFn: async () => {
      const { data } = await axiosInstance.get<PaginatedResponse>('/rm-address/paginated', {
        params,
      });
      return data;
    },
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
  });
};
