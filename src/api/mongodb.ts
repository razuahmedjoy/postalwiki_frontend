import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

export interface CollectionStats {
  collectionName: string;
  documentCount: number;
  size: number;
  storageSize: number;
  avgObjSize: number;
  indexes: {
    name: string;
    keys: string[];
    isUnique: boolean;
  }[];
  indexCount: number;
}

export const useMongoDBStats = () => {
  return useQuery({
    queryKey: ['mongodb-stats'],
    queryFn: async () => {
      const { data } = await axiosInstance.get<CollectionStats[]>('/stats');
      return data;
    },
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep data in cache for 30 minutes
  });
}; 