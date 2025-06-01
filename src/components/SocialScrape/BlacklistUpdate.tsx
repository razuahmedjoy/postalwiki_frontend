import React, { useState } from 'react';
import { useUpdateBlacklist } from '@/api/socialScrape';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';

const BlacklistUpdate: React.FC = () => {
    const [urlColumn, setUrlColumn] = useState<number>(2);
    const updateBlacklist = useUpdateBlacklist();

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

    return (
        <Card className="p-6 mb-4">
            <h2 className="text-xl font-bold mb-4">Update Blacklist</h2>
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
                            Blacklist update completed successfully
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