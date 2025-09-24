import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface CompanyHouseStats {
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

interface CompanyHouse {
	_id: string;
	CompanyName: string;
	CompanyNumber: string;
	RegAddress: {
		AddressLine1?: string;
		AddressLine2?: string;
		PostTown?: string;
		PostCode?: string;
		County?: string;
	};
	CompanyStatus?: string;
	IncorporationDate?: string;
	fullAddress?: string;
	createdAt?: string;
	updatedAt?: string;
}

type PaginationResponse = {
	total: number | null;
	page: number;
	limit: number;
	hasMore: boolean;
	nextCursor?: string | null;
};

interface PaginatedResponse {
	success: boolean;
	data: CompanyHouse[];
	pagination: PaginationResponse;
}

interface PaginatedCompanyHouseParams {
	page?: number;
	limit?: number;
	searchCompany?: string;
	searchNumber?: string;
	searchPostcode?: string;
	searchStatus?: string;
	cursor?: string;
	useCursor?: string;
}

interface SearchCompanyHouseParams {
	query: string;
	limit?: number;
}

interface SearchResponse {
	success: boolean;
	data: CompanyHouse[];
	count: number;
}

interface CompanyResponse {
	success: boolean;
	data: CompanyHouse;
}

export const useCompanyHouseStats = () => {
	return useQuery({
		queryKey: ['company-house-stats'],
		queryFn: async () => {
			const { data } = await axiosInstance.get<{ success: boolean; stats: number }>('/company-house/stats');
			return data.stats;
		},
		staleTime: 5 * 60 * 1000,
		gcTime: 30 * 60 * 1000,
		refetchOnWindowFocus: false,
		refetchOnMount: true,
	});
};

export const useCompanyHouseImport = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosInstance.post('/company-house/import');
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['company-house-stats'] });
		},
	});
};

export const useCompanyHouseImportProgress = () => {
	return useQuery({
		queryKey: ['company-house-import-progress'],
		queryFn: async () => {
			const { data } = await axiosInstance.get<{ success: boolean; data: ImportProgress }>('/company-house/import-progress');
			return data.data;
		},
		refetchInterval: 2000,
		enabled: true,
	});
};

export const useStopCompanyHouseImport = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosInstance.post('/company-house/stop-import');
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['company-house-import-progress'] });
			queryClient.invalidateQueries({ queryKey: ['company-house-stats'] });
		},
	});
};

export const usePaginatedCompanyHouse = (params: PaginatedCompanyHouseParams) => {
	return useQuery({
		queryKey: ['company-house-paginated', params],
		queryFn: async () => {
			const { data } = await axiosInstance.get<PaginatedResponse>('/company-house/paginated', {
				params,
			});
			return data;
		},
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
	});
};

export const useSearchCompanyHouse = (params: SearchCompanyHouseParams) => {
	return useQuery({
		queryKey: ['company-house-search', params],
		queryFn: async () => {
			const { data } = await axiosInstance.get<SearchResponse>('/company-house/search', {
				params,
			});
			return data;
		},
		enabled: !!params.query && params.query.length > 2,
		staleTime: 30 * 1000,
		gcTime: 5 * 60 * 1000,
	});
};

export const useCompanyHouseByNumber = (companyNumber: string) => {
	return useQuery({
		queryKey: ['company-house-detail', companyNumber],
		queryFn: async () => {
			const { data } = await axiosInstance.get<CompanyResponse>(`/company-house/company/${companyNumber}`);
			return data.data;
		},
		enabled: !!companyNumber,
		staleTime: 5 * 60 * 1000,
		gcTime: 10 * 60 * 1000,
	});
};

// Delete all CompanyHouse data
export const deleteAllCompanyHouseData = async () => {
	const { data } = await axiosInstance.delete('/company-house/delete-all', {
		data: { confirm: 'DELETE_ALL_COMPANY_HOUSE_DATA' }
	});
	return data;
};

export const useDeleteAllCompanyHouseData = () => {
	const queryClient = useQueryClient();
	
	return useMutation({
		mutationFn: deleteAllCompanyHouseData,
		onSuccess: (data) => {
			// Invalidate and refetch all CompanyHouse related queries
			queryClient.invalidateQueries({ queryKey: ['company-house'] });
			queryClient.invalidateQueries({ queryKey: ['company-house-stats'] });
		},
		onError: (error: any) => {
			console.error('Failed to delete all CompanyHouse data:', error);
		},
	});
};

