import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

interface AddressMasterStats {
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

interface AddressMaster {
	_id: string;
	postcode: string;
	district: string;
	address: string[];
	dateCreated: string;
	correctionVersion?: string;
	exceptionVersion?: string;
	is_blacklisted?: boolean;
	fullAddress?: string;
	createdAt?: string;
	updatedAt?: string;
}

interface PaginationResponse {
	page: number;
	limit: number;
	total: number;
	hasMore: boolean;
	nextCursor?: string;
}

interface PaginatedResponse {
	success: boolean;
	data: AddressMaster[];
	pagination: PaginationResponse;
}

interface PaginatedAddressMasterParams {
	page?: number;
	limit?: number;
	searchPostcode?: string;
	searchDistrict?: string;
	searchAddress?: string;
	cursor?: string;
	useCursor?: string;
}

interface SearchAddressMasterParams {
	query: string;
	limit?: number;
}

export const useAddressMasterStats = () => {
	return useQuery({
		queryKey: ['address-master-stats'],
		queryFn: async () => {
			const { data } = await axiosInstance.get<{ success: boolean; stats: number }>('/address-master/stats');
			return data.stats;
		},
		refetchOnWindowFocus: false,
		refetchOnMount: true,
	});
};

export const usePaginatedAddressMaster = (params: PaginatedAddressMasterParams) => {
	const queryParams = new URLSearchParams();

	if (params.page) queryParams.append('page', params.page.toString());
	if (params.limit) queryParams.append('limit', params.limit.toString());
	if (params.searchPostcode) queryParams.append('searchPostcode', params.searchPostcode);
	if (params.searchDistrict) queryParams.append('searchDistrict', params.searchDistrict);
	if (params.searchAddress) queryParams.append('searchAddress', params.searchAddress);
	if (params.cursor) queryParams.append('cursor', params.cursor);
	if (params.useCursor) queryParams.append('useCursor', params.useCursor);

	return useQuery({
		queryKey: ['address-master-paginated', params],
		queryFn: async () => {
			const { data } = await axiosInstance.get<PaginatedResponse>(`/address-master/data?${queryParams.toString()}`);
			return data;
		},
		refetchOnWindowFocus: false,
		refetchOnMount: true,
	});
};

export const useSearchAddressMaster = (params: SearchAddressMasterParams) => {
	return useQuery({
		queryKey: ['address-master-search', params],
		queryFn: async () => {
			const queryParams = new URLSearchParams();
			queryParams.append('query', params.query);
			if (params.limit) queryParams.append('limit', params.limit.toString());

			const { data } = await axiosInstance.get<{ success: boolean; data: AddressMaster[]; count: number }>(`/address-master/search?${queryParams.toString()}`);
			return data;
		},
		enabled: !!params.query,
		refetchOnWindowFocus: false,
		refetchOnMount: true,
	});
};

export const useAddressMasterByPostcode = (postcode: string) => {
	return useQuery({
		queryKey: ['address-master-postcode', postcode],
		queryFn: async () => {
			const { data } = await axiosInstance.get<{ success: boolean; data: AddressMaster }>(`/address-master/postcode/${postcode}`);
			return data.data;
		},
		enabled: !!postcode,
		refetchOnWindowFocus: false,
		refetchOnMount: true,
	});
};

export const useAddressMasterImport = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosInstance.post('/address-master/import');
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['address-master-stats'] });
		},
	});
};

export const useAddressMasterImportProgress = () => {
	return useQuery({
		queryKey: ['address-master-import-progress'],
		queryFn: async () => {
			const { data } = await axiosInstance.get<{ success: boolean; data: ImportProgress }>('/address-master/import-progress');
			return data.data;
		},
		refetchInterval: 2000,
		enabled: true,
	});
};

export const useStopAddressMasterImport = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosInstance.post('/address-master/stop-import');
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['address-master-import-progress'] });
		},
	});
};

export const useDeleteAllAddressMasterData = () => {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: async () => {
			const { data } = await axiosInstance.delete('/address-master/delete-all');
			return data;
		},
		onSuccess: () => {
			queryClient.invalidateQueries({ queryKey: ['address-master'] });
			queryClient.invalidateQueries({ queryKey: ['address-master-stats'] });
		},
	});
};