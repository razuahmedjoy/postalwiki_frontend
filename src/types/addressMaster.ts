export interface AddressMaster {
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

export interface AddressMasterStats {
    stats: number;
}

export interface AddressMasterImportProgress {
    currentFile: string | null;
    processed: number;
    total: number;
    upserted: number;
    modified: number;
    errors: Array<{ filename: string; error: string }>;
    isComplete: boolean;
    isRunning: boolean;
}

export interface AddressMasterSearchParams {
    query: string;
    limit?: number;
}

export interface PaginatedAddressMasterParams {
    page?: number;
    limit?: number;
    searchPostcode?: string;
    searchDistrict?: string;
    searchAddress?: string;
    cursor?: string;
    useCursor?: string;
}