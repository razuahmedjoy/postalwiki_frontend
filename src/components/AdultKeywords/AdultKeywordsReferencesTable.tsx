import React, { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent} from "@/components/ui/card";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import { 
    CheckCircle, 
    ExternalLink,
    FileText,
    AlertTriangle,
    Eye,
    Loader2
} from 'lucide-react';
import { usePaginatedAdultKeywordsReferences, useBulkProcessReferences } from '@/api/adultKeywords';
import { useEffect } from 'react';
import { Alert, AlertDescription } from "@/components/ui/alert";

export function AdultKeywordsReferencesTable() {
    const [page, setPage] = useState(1);
    const [limit] = useState(1); // Show only 1 record per page
    const [matchType, setMatchType] = useState<string>('all');
    const [processed, setProcessed] = useState<boolean | null>(false);
    const [successMessage, setSuccessMessage] = useState<string>('');
    const [processingRecords, setProcessingRecords] = useState<Set<string>>(new Set());
    const [iframeLoading, setIframeLoading] = useState(true);

    const { data, isLoading, isFetching, refetch } = usePaginatedAdultKeywordsReferences(
        page, 
        limit, 
        matchType === 'all' ? undefined : matchType, 
        processed
    );

    const bulkProcessMutation = useBulkProcessReferences();

    // Reset iframe loading when page changes or data changes
    useEffect(() => {
        setIframeLoading(true);
    }, [page, data?.references]);

    // Individual record processing
    const handleIndividualProcess = async (recordId: string, isAdultContent: boolean) => {
        if (processingRecords.has(recordId)) return;
        
        setProcessingRecords(prev => new Set(prev).add(recordId));
        
        try {
            const result = await bulkProcessMutation.mutateAsync({ 
                recordIds: [recordId], 
                isAdultContent 
            });
            
            // Show success message
            setSuccessMessage(result.message);
            
            // Refresh data to show updated status
            refetch();
            
            // Clear success message after 5 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 5000);
            
        } catch (error) {
            console.error(`Failed to process record ${recordId}:`, error);
            setSuccessMessage(`Error: Failed to process record. Please try again.`);
            setTimeout(() => {
                setSuccessMessage('');
            }, 5000);
        } finally {
            setProcessingRecords(prev => {
                const newSet = new Set(prev);
                newSet.delete(recordId);
                return newSet;
            });
        }
    };

    const getMatchTypeBadge = (matchType: string) => {
        if (matchType === 'exact') {
            return <Badge variant="destructive">Exact Match</Badge>;
        }
        return <Badge variant="secondary">Contains Match</Badge>;
    };

    const getProcessedBadge = (processed: boolean) => {
        if (processed) {
            return <Badge variant="default" className="bg-green-600">Processed</Badge>;
        }
        return <Badge variant="outline">Pending</Badge>;
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleIframeLoad = () => {
        setIframeLoading(false);
    };

    const handleIframeError = () => {
        setIframeLoading(false);
        console.error('Iframe failed to load');
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">


            {/* Results Summary */}
            {data && (
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>
                        Showing {((page - 1) * limit) + 1} to {Math.min(page * limit, data.pagination.total)} of {data.pagination.total} references
                    </span>
                    {isFetching && (
                        <span className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                            Updating...
                        </span>
                    )}
                </div>
            )}
               {/* Pagination */}
            {data && data.pagination.pages > 1 && (
                <div className="overflow-x-auto">
                    <Pagination>
                        <PaginationContent className="flex-wrap justify-center">
                            <PaginationItem>
                                <PaginationPrevious 
                                    onClick={() => setPage(page - 1)}
                                    className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                            
                            {/* Show fewer page numbers on mobile */}
                            {Array.from({ length: Math.min(5, data.pagination.pages) }, (_, i) => {
                                const pageNum = i + 1;
                                return (
                                    <PaginationItem key={pageNum}>
                                        <PaginationLink
                                            onClick={() => setPage(pageNum)}
                                            isActive={page === pageNum}
                                            className="cursor-pointer"
                                        >
                                            {pageNum}
                                        </PaginationLink>
                                    </PaginationItem>
                                );
                            })}
                            
                            {data.pagination.pages > 5 && (
                                <>
                                    {page > 3 && <PaginationItem><span className="px-2">...</span></PaginationItem>}
                                    {page > 3 && page < data.pagination.pages - 2 && (
                                        <PaginationItem>
                                            <PaginationLink onClick={() => setPage(page)} isActive>
                                                {page}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )}
                                    {page < data.pagination.pages - 2 && <PaginationItem><span className="px-2">...</span></PaginationItem>}
                                    {page < data.pagination.pages - 2 && (
                                        <PaginationItem>
                                            <PaginationLink onClick={() => setPage(data.pagination.pages)}>
                                                {data.pagination.pages}
                                            </PaginationLink>
                                        </PaginationItem>
                                    )}
                                </>
                            )}
                            
                            <PaginationItem>
                                <PaginationNext 
                                    onClick={() => setPage(page + 1)}
                                    className={page >= data.pagination.pages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                                />
                            </PaginationItem>
                        </PaginationContent>
                    </Pagination>
                </div>
            )}


            {/* Success Message */}
            {successMessage && (
                <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <AlertDescription className="text-green-800 dark:text-green-200">
                        {successMessage}
                    </AlertDescription>
                </Alert>
            )}

            {/* Single Record View */}
            {data?.references && data.references.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-screen">
                    {/* Record Details */}
                    <Card className='col-span-1'>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {/* URL and Actions */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2">
                                        <a
                                            href={`https://${data.references[0].url}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-lg font-medium dark:text-blue-400"
                                            title={data.references[0].url}
                                        >
                                            {data.references[0].url}
                                        </a>
                                        <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                    </div>
                                    
                                    {/* Action Buttons */}
                                    <div className="flex flex-col gap-3">
                                        <Button
                                            variant="destructive"
                                            onClick={() => handleIndividualProcess(data.references[0]._id, true)}
                                            disabled={processingRecords.has(data.references[0]._id)}
                                            className="flex-1"
                                        >
                                            {processingRecords.has(data.references[0]._id) ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                            ) : (
                                                <>
                                                    <AlertTriangle className="h-4 w-4 mr-2" />
                                                    Mark as Adult Content
                                                </>
                                            )}
                                        </Button>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleIndividualProcess(data.references[0]._id, false)}
                                            disabled={processingRecords.has(data.references[0]._id)}
                                            className="flex-1"
                                        >
                                            {processingRecords.has(data.references[0]._id) ? (
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                            ) : (
                                                <>
                                                    <CheckCircle className="h-4 w-4 mr-2" />
                                                    Mark as Not Adult Content
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                </div>

                                {/* Content Details */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-semibold text-foreground">Content Details</h3>
                                    
                                    {data.references[0].title && (
                                        <div>
                                            <div className="text-sm font-medium text-muted-foreground mb-2">Title:</div>
                                            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap p-3 bg-muted/50 dark:bg-muted rounded border text-foreground">
                                                {data.references[0].title}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {data.references[0].meta_description && (
                                        <div>
                                            <div className="text-sm font-medium text-muted-foreground mb-2">Description:</div>
                                            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap p-3 bg-muted/50 dark:bg-muted rounded border text-foreground">
                                                {data.references[0].meta_description}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {data.references[0].keywords && (
                                        <div>
                                            <div className="text-sm font-medium text-muted-foreground mb-2">Keywords:</div>
                                            <div className="text-sm leading-relaxed break-words whitespace-pre-wrap p-3 bg-muted/50 dark:bg-muted rounded border text-foreground">
                                                {data.references[0].keywords}
                                            </div>
                                        </div>
                                    )}
                                    
                                    {!data.references[0].title && !data.references[0].meta_description && !data.references[0].keywords && (
                                        <div className="text-sm text-muted-foreground italic p-3 bg-muted/50 dark:bg-muted rounded border">No content data</div>
                                    )}
                                </div>

                                {/* Matched Keywords */}
                                <div className="space-y-3">
                                    <h3 className="text-lg font-semibold text-foreground">Matched Keywords</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {data.references[0].matched_keywords.map((keyword, index) => (
                                            <Badge key={index} variant="outline" className="text-sm">
                                                {keyword}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Record Info */}
                                <div className="space-y-3 pt-4 border-t border-border">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Match Type:</span>
                                        {getMatchTypeBadge(data.references[0].match_type)}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Status:</span>
                                        {getProcessedBadge(data.references[0].processed)}
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-muted-foreground">Created:</span>
                                        <span className="text-foreground">{formatDate(data.references[0].created_at)}</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Website Preview */}
                    <Card className='col-span-2 h-screen'>
                        <CardContent className="p-0">
                            <div className="border-b border-border p-4 bg-muted/50 dark:bg-muted">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-lg font-semibold text-foreground">Website Preview</h3>
                                    <Eye className="h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                            <div className="h-screen overflow-hidden relative">
                                {/* Loading State */}
                                {iframeLoading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-muted/50 dark:bg-muted z-10 h-full">
                                        <div className="flex flex-col items-center gap-3">
                                            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                            <p className="text-sm text-muted-foreground">Loading website preview...</p>
                                        </div>
                                    </div>
                                )}
                                
                                <iframe
                                    src={`https://${data.references[0].url}`}
                                    className="w-full h-full border-0"
                                    title={`Preview of ${data.references[0].url}`}
                                    sandbox="allow-scripts allow-same-origin"
                                    loading="lazy"
                                    onLoad={handleIframeLoad}
                                    onError={handleIframeError}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

         
            {/* No Results */}
            {data && data.references.length === 0 && (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2 text-foreground">No references found</h3>
                        <p className="text-muted-foreground">
                            Try adjusting your filters or search criteria
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}