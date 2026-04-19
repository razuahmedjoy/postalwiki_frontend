import React, { useRef, useEffect } from 'react';

interface ProgressData {
    currentFile: string | null;
    processed: number;
    total: number;
    upserted: number;
    modified: number;
    skipped?: number;
    skippedSamples?: Array<{ filename: string; reason: string; rowPreview: string }>;
    errors: Array<{ filename: string; error: string }>;
    isComplete: boolean;
}

interface LogEntry {
    type: 'success' | 'error';
    message: string;
}

interface ImportProgressProps {
    progress: ProgressData;
    logs: LogEntry[];
    title?: string;
}

const ImportProgress: React.FC<ImportProgressProps> = ({ 
    progress, 
    logs, 
    title = "Import Progress" 
}) => {
    const logsEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (logsEndRef.current) {
            logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs]);

    return (
        <>
            {progress.currentFile && (
                <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">{title}</h3>
                    <div className="p-4 bg-gray-50 dark:bg-gray-900/60 rounded-md border border-gray-200 dark:border-gray-700">
                        <p className="font-medium mb-2">Processing: {progress.currentFile}</p>
                        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(progress.processed / (progress.total || 1)) * 100}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
                            <p>
                                Processed: {progress.isComplete ? 'Processing done' : (
                                    <>
                                        <span className="inline-block animate-spin mr-1">⟳</span>
                                        {progress.processed}
                                    </>
                                )}
                            </p>
                            <p>Upserted: {progress.upserted}</p>
                            <p>Modified: {progress.modified}</p>
                            <p>Skipped: {progress.skipped ?? 0}</p>
                            <p>Errors: {progress.errors.length}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-6">
                <h3 className="text-lg font-semibold mb-2">Import Logs</h3>
                <div className="max-h-[300px] overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md p-3 bg-white dark:bg-gray-900/40">
                    {logs.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-300">No logs available</p>
                    ) : (
                        <div className="space-y-2">
                            {logs.map((log, index) => (
                                <div 
                                    key={index} 
                                    className={`p-2 rounded ${
                                        log.type === 'error'
                                            ? 'bg-red-50 text-red-700 dark:bg-red-300/20 dark:text-red-200'
                                            : 'bg-green-50 text-green-700 dark:bg-green-300/20 dark:text-green-200'
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
                    <div className="max-h-[200px] overflow-y-auto border border-red-200 dark:border-red-400/40 rounded-md p-3 bg-white dark:bg-gray-900/40">
                        {progress.errors.map((error, index) => (
                            <div key={index} className="p-2.5 mb-2 bg-red-50 text-red-800 dark:bg-red-300/20 dark:text-red-100 rounded-md">
                                <p className="font-medium">{error.filename}</p>
                                <p className="text-sm">{error.error}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {progress.skippedSamples && progress.skippedSamples.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold mb-2">Recent Skipped Rows</h3>
                    <div className="max-h-[240px] overflow-y-auto border border-amber-200 dark:border-amber-400/40 rounded-md p-3 bg-white dark:bg-gray-900/40">
                        {progress.skippedSamples.map((item, index) => (
                            <div key={index} className="p-2.5 mb-2 bg-amber-50 text-amber-900 dark:bg-amber-300/20 dark:text-amber-100 rounded-md">
                                <p className="font-medium">{item.filename}</p>
                                <p className="text-sm">Reason: {item.reason}</p>
                                {item.rowPreview && (
                                    <p className="text-xs text-amber-700 dark:text-amber-200 font-mono mt-1 break-all">{item.rowPreview}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </>
    );
};

export default ImportProgress; 