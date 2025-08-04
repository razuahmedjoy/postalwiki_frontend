import { useState, useEffect, useRef } from 'react';
import { axiosInstance } from '@/lib/axios';

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

interface UseImportProgressOptions {
    progressEndpoint: string;
    pollingInterval?: number;
}

export const useImportProgress = ({ 
    progressEndpoint, 
    pollingInterval = 2000 
}: UseImportProgressOptions) => {
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
    const intervalRef = useRef<NodeJS.Timeout>();

    // Cleanup polling on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, []);

    const fetchProgress = async () => {
        try {
            const response = await axiosInstance.get(progressEndpoint);
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
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                        intervalRef.current = undefined;
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
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = undefined;
            }
            setLogs(prev => [...prev, {
                type: 'error',
                message: 'Error fetching progress'
            }]);
        }
    };

    const startPolling = () => {
        setIsPolling(true);
        setLogs(prev => [...prev, {
            type: 'success',
            message: 'Starting import process...'
        }]);
        
        // Clear any existing polling
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
        
        // Start polling
        intervalRef.current = setInterval(fetchProgress, pollingInterval);
        // Fetch progress immediately
        fetchProgress();
    };

    const resetProgress = () => {
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
    };

    const addLog = (log: LogEntry) => {
        setLogs(prev => [...prev, log]);
    };

    return {
        progress,
        logs,
        isPolling,
        startPolling,
        resetProgress,
        addLog,
        fetchProgress
    };
}; 