import React, { useState } from 'react';
import { useUpdateBlacklist, useBlacklistedCount } from '@/api/socialScrape';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { Badge } from "@/components/ui/badge";
import { Shield } from 'lucide-react';

const BlacklistUpdate: React.FC = () => {
    const [urlColumn, setUrlColumn] = useState<number>(2);
    const updateBlacklist = useUpdateBlacklist();
    const queryClient = useQueryClient();
    
    // Get blacklisted count
    const { data: blacklistedData, isLoading: isLoadingCount, error: countError } = useBlacklistedCount();

    const { data: progress, isLoading: isLoadingProgress } = useQuery({
        queryKey: ['blacklistProgress'],
        queryFn: async () => {
            const response = await axiosInstance.get('/social-scrape/blacklist-progress');
            return response.data;
        },
        refetchInterval: 1000, // Poll every second
        enabled: updateBlacklist.isPending
    });

    const handleUpdate = () => {
        updateBlacklist.mutate(urlColumn);
    };

    const handleRefreshCount = () => {
        queryClient.invalidateQueries({ queryKey: ['blacklistedCount'] });
    };

    const testApiCall = async () => {
        try {
            const response = await axiosInstance.get('/social-scrape/blacklisted/count');
            alert(`API Response: ${JSON.stringify(response.data)}`);
        } catch (error) {
            console.error('Manual API test error:', error);
            alert(`API Error: ${error.message}`);
        }
    };

    // Invalidate and refetch blacklisted count when processing completes
    React.useEffect(() => {
        if (updateBlacklist.isSuccess || (progress && progress.isComplete)) {
            // Invalidate and refetch the blacklisted count
            queryClient.invalidateQueries({ queryKey: ['blacklistedCount'] });
        }
    }, [updateBlacklist.isSuccess, progress?.isComplete, queryClient]);

    return (
        <Card className="p-6 mb-4">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Blacklist Processing
            </h2>
            
            {/* Blacklisted Count Display */}
            <div className="mb-4 flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total Blacklisted Records:</span>
                {isLoadingCount ? (
                    <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        <span className="text-sm text-muted-foreground">Loading...</span>
                    </div>
                ) : countError ? (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-red-600">Error: {countError.message}</span>
                    </div>
                ) : blacklistedData && blacklistedData.count !== undefined ? (
                    <Badge variant="secondary" className="text-base px-2 py-1">
                        {blacklistedData.count.toLocaleString()}
                    </Badge>
                ) : (
                    <Badge variant="outline" className="text-base px-2 py-1">
                        No data
                    </Badge>
                )}
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={handleRefreshCount}
                    disabled={isLoadingCount}
                >
                    Refresh
                </Button>
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={testApiCall}
                >
                    Test API
                </Button>
            </div>
            
            {/* Test display - remove this later */}
            <div className="mb-4 p-2 bg-yellow-100 dark:bg-yellow-900 rounded text-xs">
                <p>Test: Hardcoded value: 1234</p>
                <p>Test: API Response: {JSON.stringify(blacklistedData)}</p>
                <p>Test: Loading State: {isLoadingCount ? 'Yes' : 'No'}</p>
                <p>Test: Error State: {countError ? 'Yes' : 'No'}</p>
                <p>Test: Has Data: {blacklistedData ? 'Yes' : 'No'}</p>
                <p>Test: Count Value: {blacklistedData?.count}</p>
            </div>

            {/* Debug info - remove this later */}
            {process.env.NODE_ENV === 'development' && (
                <div className="mb-4 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                    <p>Debug: Data: {JSON.stringify(blacklistedData)}</p>
                    <p>Debug: Loading: {isLoadingCount}</p>
                    <p>Debug: Error: {countError?.message || 'None'}</p>
                </div>
            )}

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        URL Column Number (default: 2)
                    </label>
                    <Input
                        type="text"
                        value={urlColumn}
                        onChange={(e) => setUrlColumn(Number(e.target.value))}
                        className="max-w-xs"
                    />
                </div>

                <Button
                    onClick={handleUpdate}
                    disabled={updateBlacklist.isPending}
                >
                    {updateBlacklist.isPending ? 'Processing...' : 'Start Blacklist Update'}
                </Button>

                {updateBlacklist.isPending && (
                    <div className="mt-4">
                        <div className="space-y-2">
                            <p>Processing files...</p>
                            {progress && (
                                <>
                                    <p>Processed: {progress.processed} / {progress.total}</p>
                                    <p>Upserted: {progress.upserted}</p>
                                    <p>Modified: {progress.modified}</p>
                                    {progress.errors.length > 0 && (
                                        <Alert variant="destructive">
                                            <AlertTitle>Errors</AlertTitle>
                                            <AlertDescription>
                                                <ul>
                                                    {progress.errors.map((error: string, index: number) => (
                                                        <li key={index}>{error}</li>
                                                    ))}
                                                </ul>
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </>
                            )}
                        </div>
                    </div>
                )}

                {updateBlacklist.isSuccess && (
                    <Alert>
                        <AlertTitle>Success</AlertTitle>
                        <AlertDescription>
                            Blacklist update completed successfully. The count above has been updated.
                        </AlertDescription>
                    </Alert>
                )}

                {updateBlacklist.isError && (
                    <Alert variant="destructive">
                        <AlertTitle>Error</AlertTitle>
                        <AlertDescription>
                            {updateBlacklist.error?.message || 'An error occurred'}
                        </AlertDescription>
                    </Alert>
                )}
            </div>
        </Card>
    );
};

export default BlacklistUpdate; 