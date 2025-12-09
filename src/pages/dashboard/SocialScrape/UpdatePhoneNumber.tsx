import { axiosInstance } from '@/lib/axios';
import { CSV_UPLOAD_PATHS } from '@/lib/constant';
import React, { useState, useEffect } from 'react';

interface PhoneProgress {
    currentFile: string | null;
    processed: number;
    total: number;
    updated: number;
    created: number;
    errors: string[];
    isComplete: boolean;
    totalFiles: number;
    completedFiles: number;
}

interface ApiError {
    response?: {
        data?: {
            message?: string;
        };
    };
    message: string;
}

const UpdatePhoneNumberPage = () => {
    const [isProcessing, setIsProcessing] = useState(false);
    const [processId, setProcessId] = useState<string | null>(null);
    const [progress, setProgress] = useState<PhoneProgress | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const startPhoneProcessing = async () => {
        try {
            setIsProcessing(true);
            setError(null);
            setSuccess(null);
            setProgress(null);

            const response = await axiosInstance.post('/social-scrape/update-phone-number');
            
            if (response.data.success) {
                setProcessId(response.data.processId);
                setSuccess(`Phone number processing started! Process ID: ${response.data.processId}`);
                
                // Start polling for progress
                pollProgress(response.data.processId);
            } else {
                setError('Failed to start phone number processing');
            }
        } catch (error: unknown) {
            const apiError = error as ApiError;
            setError(apiError.response?.data?.message || 'Failed to start phone number processing');
        } finally {
            setIsProcessing(false);
        }
    };

    const stopPhoneProcessing = async () => {
        if (!processId) {
            setError('No active process to stop');
            return;
        }

        try {
            const response = await axiosInstance.post('/social-scrape/stop-phone-processing', {
                processId: processId
            });
            
            if (response.data.success) {
                setSuccess('Phone processing stopped successfully');
                setIsProcessing(false);
                setProcessId(null);
            } else {
                setError('Failed to stop phone processing');
            }
        } catch (error: unknown) {
            const apiError = error as ApiError;
            setError(apiError.response?.data?.message || 'Failed to stop phone processing');
        }
    };

    const pollProgress = async (id: string) => {

        
        const pollInterval = setInterval(async () => {
            try {
           
                const response = await axiosInstance.get(`/social-scrape/phone-progress?processId=${id}`);
                const progressData = response.data;
                
                setProgress(progressData);
                
                if (progressData.isComplete) {
                    clearInterval(pollInterval);
                    setIsProcessing(false);
                    
                    if (progressData.errors.length > 0) {
                        setError(`Processing completed with ${progressData.errors.length} errors. Check logs for details.`);
                    } else {
                        setSuccess(`Processing completed successfully! Updated: ${progressData.updated}, Created: ${progressData.created}`);
                    }
                }
            } catch (error: unknown) {
                console.error('Error polling progress:', error);
                clearInterval(pollInterval);
                setIsProcessing(false);
                setError('Failed to get progress updates');
            }
        }, 2000); // Poll every 2 seconds
    };

    const getProgressPercentage = () => {
        if (!progress) return 0;
        if (progress.total === 0) {
            // If total is 0, show progress based on completed files vs total files
            if (progress.totalFiles > 0) {
                return Math.round((progress.completedFiles / progress.totalFiles) * 100);
            }
            return 0;
        }
        return Math.round((progress.processed / progress.total) * 100);
    };

    return (
        <div className="p-5 mx-auto">
            <h2 className="text-2xl font-bold mb-4">Update Phone Numbers</h2>

            <div className="mb-6">
                <p className="text-gray-600 dark:text-gray-200 mb-2">
                    This process will read CSV files from the <code className="bg-gray-600 text-white px-1 rounded">{CSV_UPLOAD_PATHS.SOCIAL_SCRAPE_UPDATE_PHONE_NUMBER}</code> directory 
                    and update phone numbers for existing records or create new records with phone numbers.
                </p>
                <p className="text-gray-400">
                    <strong>CSV Format:</strong> url, [PN], phone_number (no headers)
                </p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setError(null)}
                                className="inline-flex text-red-400 hover:text-red-600"
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {success && (
                <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-green-800">{success}</p>
                        </div>
                        <div className="ml-auto pl-3">
                            <button
                                onClick={() => setSuccess(null)}
                                className="inline-flex text-green-400 hover:text-green-600"
                            >
                                <span className="sr-only">Dismiss</span>
                                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <button
                    onClick={startPhoneProcessing}
                    disabled={isProcessing}
                    className={`px-5 py-2.5 text-base font-medium rounded-md text-white 
                        ${isProcessing
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'}`}
                >
                    {isProcessing ? (
                        <div className="flex items-center">
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Processing Phone Numbers...
                        </div>
                    ) : (
                        'Start Phone Number Processing'
                    )}
                </button>
                
                {isProcessing && processId && (
                    <button
                        onClick={stopPhoneProcessing}
                        className="ml-4 px-5 py-2.5 text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 cursor-pointer"
                    >
                        Stop Processing
                    </button>
                )}
            </div>

            {progress && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-4">Processing Progress</h3>
                    <div className="p-4 bg-gray-50 rounded-md">
                        <div className="mb-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                                <span className="text-sm font-medium text-gray-700">{getProgressPercentage()}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                    className={`h-2.5 rounded-full ${progress.isComplete ? 'bg-green-600' : 'bg-blue-600'}`}
                                    style={{ width: `${getProgressPercentage()}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Current File:</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                    {progress.currentFile || 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Files Progress:</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                                    {progress.completedFiles || 0}/{progress.totalFiles || 0}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Processed Records:</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {progress.processed.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Total Records:</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                    {progress.total.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">Records Updated:</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                    {progress.updated.toLocaleString()}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-sm text-gray-600">New Records Created:</span>
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    {progress.created.toLocaleString()}
                                </span>
                            </div>
                        </div>

                        {progress.errors.length > 0 && (
                            <div className="mt-4">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-sm text-gray-600">Errors:</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                        {progress.errors.length}
                                    </span>
                                </div>
                                <div className="text-xs text-gray-500">
                                    Check the logs for detailed error information.
                                </div>
                            </div>
                        )}

                        {progress.isComplete && (
                            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                                <h4 className="text-sm font-medium text-blue-800 mb-2">Processing Complete!</h4>
                                <div className="text-sm text-blue-700 space-y-1">
                                    <div>Total processed: {progress.processed.toLocaleString()}</div>
                                    <div>Records updated: {progress.updated.toLocaleString()}</div>
                                    <div>New records created: {progress.created.toLocaleString()}</div>
                                    <div>Errors: {progress.errors.length}</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {processId && (
                <div className="mt-4">
                    <p className="text-sm text-gray-500">
                        Process ID: <code className="bg-gray-100 px-1 rounded text-xs">{processId}</code>
                    </p>
                </div>
            )}
        </div>
    );
};

export default UpdatePhoneNumberPage;