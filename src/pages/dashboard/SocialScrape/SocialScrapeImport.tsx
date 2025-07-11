// components/SocialScrapeImport.tsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocialScrapeStats, useSocialScrapeImport } from '@/api/socialScrape';
import { toast } from 'sonner';
import { axiosInstance } from '@/lib/axios';
import socialScrapeCSVFormatImage from '@/assets/images/social_scrape/social_scrape_csv_format.jpg';

interface ProgressData {
    currentFile: string | null;
    processed: number;
    total: number;
    upserted: number;
    modified: number;
    errors: Array<{ filename: string; error: string }>;
    isComplete: boolean;
}

interface LogEntry {
    type: 'success' | 'error';
    message: string;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
    message: string;
}

const SocialScrapeImport: React.FC = () => {
    const [progress, setProgress] = useState<ProgressData>({
        currentFile: null,
        processed: 0,
        total: 0,
        upserted: 0,
        modified: 0,
        errors: [],
        isComplete: false
    });
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [isPolling, setIsPolling] = useState(false);
    const pollingInterval = useRef<NodeJS.Timeout>();
    const logsEndRef = useRef<HTMLDivElement>(null);

    const { data: stats, isLoading: isLoadingStats } = useSocialScrapeStats();
    const { mutate: startImport, isPending: isImporting } = useSocialScrapeImport();

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
            }
        };
    }, []);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    const fetchProgress = async () => {
        try {
            const response = await axiosInstance.get('/social-scrape/import-progress');
            if (response.data.success) {
                const newProgress = response.data.data;
                setProgress(newProgress);

                // Add logs for significant changes
                if (newProgress.currentFile && newProgress.processed > 0) {
                    setLogs(prev => {
                        const lastLog = prev[prev.length - 1];
                        const newMessage = `Processing ${newProgress.currentFile}: ${newProgress.processed} records`;
                        if (!lastLog || lastLog.message !== newMessage) {
                            return [...prev, {
                                type: 'success',
                                message: newMessage
                            }];
                        }
                        return prev;
                    });
                }

                // Add error logs
                if (newProgress.errors.length > 0) {
                    newProgress.errors.forEach(error => {
                        setLogs(prev => {
                            const lastLog = prev[prev.length - 1];
                            const newMessage = `Error in ${error.filename}: ${error.error}`;
                            if (!lastLog || lastLog.message !== newMessage) {
                                return [...prev, {
                                    type: 'error',
                                    message: newMessage
                                }];
                            }
                            return prev;
                        });
                    });
                }

                // Stop polling if import is complete
                if (newProgress.isComplete || !newProgress.isRunning) {
                    setIsPolling(false);
                    if (pollingInterval.current) {
                        clearInterval(pollingInterval.current);
                        pollingInterval.current = undefined;
                    }
                    setLogs(prev => [...prev, {
                        type: 'success',
                        message: 'Import completed successfully'
                    }]);
                }
            }
        } catch (error) {
            console.error('Error fetching progress:', error);
            setIsPolling(false);
            if (pollingInterval.current) {
                clearInterval(pollingInterval.current);
                pollingInterval.current = undefined;
            }
            setLogs(prev => [...prev, {
                type: 'error',
                message: 'Error fetching progress'
            }]);
        }
    };

    const handleImport = () => {
        setProgress({
            currentFile: null,
            processed: 0,
            total: 0,
            upserted: 0,
            modified: 0,
            errors: [],
            isComplete: false
        });
        setLogs([]);

        // Clear any existing polling
        if (pollingInterval.current) {
            clearInterval(pollingInterval.current);
            pollingInterval.current = undefined;
        }

        startImport(undefined, {
            onSuccess: () => {
                setIsPolling(true);
                setLogs(prev => [...prev, {
                    type: 'success',
                    message: 'Starting import process...'
                }]);
                // Start polling every 2 seconds
                pollingInterval.current = setInterval(fetchProgress, 2000);
                // Fetch progress immediately
                fetchProgress();
            },
            onError: (error: ApiError) => {
                setLogs(prev => [...prev, {
                    type: 'error',
                    message: error?.response?.data?.message || error.message || 'Import failed'
                }]);
                toast.error('Import failed: ' + (error?.response?.data?.message || error.message));
            }
        });
    };

    return (
        <div className="p-5 max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">Social Scrape Import - {isLoadingStats ? 'Loading...' : stats?.toLocaleString()}</h2>

            <div className="mb-6">
                <p>Upload CSV files to the server in <span className="font-bold bg-black p-1 text-sm">home/lysnar/api.postalwiki.co.uk/imports/social_scrape/</span></p>
                <p>Make sure to each file should have columns in the following order:</p>
                <p>URL,CODE,RESULT,DATE</p>
                <img src={socialScrapeCSVFormatImage} alt="Social Scrape CSV Format" className='w-1/3' />

            </div>

            <div className="mb-6">
                <button
                    onClick={handleImport}
                    disabled={isImporting || isPolling}
                    className={`px-5 py-2.5 text-base font-medium rounded-md text-white 
                        ${(isImporting || isPolling)
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
                >
                    {isImporting ? 'Starting Import...' : isPolling ? 'Importing...' : 'Start Import'}
                </button>
            </div>

            {progress.currentFile && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Current Progress</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                        <p className="font-medium mb-2">Processing: {progress.currentFile}</p>
                        <div className="h-5 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(progress.processed / (progress.total || 1)) * 100}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <p>Processed: {progress.isComplete ? 'Processing done' : (
                                <>
                                    <span className="inline-block animate-spin mr-1">⟳</span>
                                    {progress.processed}
                                </>
                            )}</p>
                            <p>Upserted: {progress.upserted}</p>
                            <p>Modified: {progress.modified}</p>
                            <p>Errors: {progress.errors.length}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Import Logs</h3>
                <div className="max-h-[300px] overflow-y-auto border border-gray-200 rounded-md p-3">
                    {logs.length === 0 ? (
                        <p className="text-gray-500">No logs available</p>
                    ) : (
                        <div className="space-y-2">
                            {logs.map((log, index) => (
                                <div 
                                    key={index} 
                                    className={`p-2 rounded ${
                                        log.type === 'error'
                                            ? 'bg-red-50 text-red-700'
                                            : 'bg-green-50 text-green-700'
                                    }`}
                                >
                                    {log.message}
                                </div>
                            ))}
                            <div ref={logsEndRef} />
                        </div>
                    )}
                </div>
            </div>

            {progress.errors.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold mb-2">Errors</h3>
                    <div className="max-h-[200px] overflow-y-auto border border-red-200 rounded-md p-3">
                        {progress.errors.map((error, index) => (
                            <div key={index} className="p-2.5 mb-2 bg-red-50 text-red-800 rounded-md">
                                <p className="font-medium">{error.filename}</p>
                                <p className="text-sm">{error.error}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SocialScrapeImport;