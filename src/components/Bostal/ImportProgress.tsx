import React, { useRef, useEffect } from 'react';

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
                    <div className="p-4 bg-gray-50 rounded-md">
                        <p className="font-medium mb-2">Processing: {progress.currentFile}</p>
                        <div className="h-5 bg-gray-200 rounded-full overflow-hidden mb-2">
                            <div
                                className="h-full bg-green-500 transition-all duration-300"
                                style={{ width: `${(progress.processed / (progress.total || 1)) * 100}%` }}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
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
        </>
    );
};

export default ImportProgress; 