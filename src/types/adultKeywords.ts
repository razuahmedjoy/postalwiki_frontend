// Types for Adult Keywords functionality
export interface AdultKeywordsProgress {
    currentFile: string | null;
    processed: number;
    total: number;
    exactMatches: number;
    containsMatches: number;
    updatedRecords: number;
    createdReferences: number;
    errors: Array<{
        error: string;
        timestamp: string;
        file?: string;
    }>;
    isComplete: boolean;
    isRunning: boolean;
}

export interface AdultKeywordsStats {
    totalReferences: number;
    unprocessedReferences: number;
    exactMatches: number;
    containsMatches: number;
    currentProgress: AdultKeywordsProgress;
}

export interface AdultKeywordsReference {
    _id: string;
    url: string;
    title: string;
    meta_description: string;
    keywords: string;
    matched_keywords: string[];
    match_type: 'exact' | 'contains';
    csv_source: string;
    processed: boolean;
    processed_at: string | null;
    created_at: string;
    updated_at: string;
} 