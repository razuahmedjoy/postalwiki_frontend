import React, { useState, useEffect, useRef } from 'react';
import { useUpdateBlacklist, useBlacklistedCount } from '@/api/socialScrape';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '@/lib/axios';
import { Loader2, Shield, Database } from 'lucide-react';
import { Badge } from "@/components/ui/badge";

interface LogEntry {
    type: 'info' | 'error' | 'success';
    message: string;
    timestamp: string;
}

interface ProgressData {
    currentFile: string | null;
    processed: number;
    total: number;
    upserted: number;
    modified: number;
    errors: string[];
    isComplete: boolean;
}

const BlacklistProcessPage: React.FC = () => {
    const [urlColumn, setUrlColumn] = useState<number>(2);
    const [isProcessing, setIsProcessing] = useState(false);
    const [logs, setLogs] = useState<string[]>([]);
    const [processId, setProcessId] = useState<string | null>(null);
    const updateBlacklist = useUpdateBlacklist();
    const queryClient = useQueryClient();
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Get blacklisted count
    const { data: blacklistedData, isLoading: isLoadingCount } = useBlacklistedCount();

    // Auto-scroll to bottom when logs update
    const scrollToBottom = () => {
        logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [logs]);

    // Query for progress updates
    const { data: progress } = useQuery({
        queryKey: ['blacklistProgress', processId],
        queryFn: async () => {
            if (!processId) return null;
            const response = await axiosInstance.get(`/social-scrape/blacklist-progress?processId=${processId}`);
            return response.data;
        },
        enabled: isProcessing && !!processId,
        refetchInterval: 1000
    });

    // Update logs when progress changes
    useEffect(() => {
        if (!progress) return;

        const newLogs: string[] = [];
        
        // Add current file being processed
        if (progress.currentFile) {
            newLogs.push(`Processing file: ${progress.currentFile}`);
        }

        // Add progress information
        if (progress.total > 0) {
            newLogs.push(`Processed ${progress.processed} of ${progress.total} records`);
            newLogs.push(`Upserted: ${progress.upserted}, Modified: ${progress.modified}, Errors: ${progress.errors.length}`);
        }

        // Add completion message
        if (progress.isComplete) {
            newLogs.push('Processing completed!');
            setIsProcessing(false);
            
            // Refresh the blacklisted count when processing completes
            queryClient.invalidateQueries({ queryKey: ['blacklistedCount'] });
        }

        if (newLogs.length > 0) {
            setLogs(prev => [...prev, ...newLogs]);
        }
    }, [progress]);

    const handleStartProcess = async () => {
        try {
            setIsProcessing(true);
            setLogs([]);
            setProcessId(null);

            const response = await axiosInstance.post('/social-scrape/update-blacklist', {
                urlColumn
            });

            setProcessId(response.data.processId);
            setLogs(prev => [...prev, 'Starting blacklist update process...']);
        } catch (error) {
            console.error('Error starting process:', error);
            setLogs(prev => [...prev, 'Error starting process. Please try again.']);
            setIsProcessing(false);
        }
    };

    return (
        <div className="p-4 mx-auto bg-background">
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
                        onClick={() => queryClient.invalidateQueries({ queryKey: ['blacklistedCount'] })}
                        disabled={isLoadingCount}
                    >
                        Refresh
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            URL Column Number (default: 2)
                        </label>
                        <Input
                            type="number"
                            min={1}
                            value={urlColumn}
                            onChange={(e) => setUrlColumn(parseInt(e.target.value) || 2)}
                            className="max-w-xs"
                        />
                    </div>

                    <Button
                        onClick={handleStartProcess}
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Start Blacklist Update'
                        )}
                    </Button>

                    {/* Processing Logs */}
                    <div className="mt-6">
                        <h3 className="text-lg font-semibold mb-2">Processing Logs</h3>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 h-[400px] overflow-y-auto">
                            {logs.length === 0 ? (
                                <p className="text-gray-500 dark:text-gray-400">No logs available</p>
                            ) : (
                                <div className="space-y-2">
                                    {logs.map((log, index) => (
                                        <div
                                            key={index}
                                            className={`p-2 rounded ${
                                                log.includes('error')
                                                    ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                                                    : log.includes('success')
                                                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                                    : 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span>{log}</span>
                                            </div>
                                        </div>
                                    ))}
                                    <div ref={logsEndRef} />
                                </div>
                            )}
                        </div>
                    </div>

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
        </div>
    );
};

export default BlacklistProcessPage; 