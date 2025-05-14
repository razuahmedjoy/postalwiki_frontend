import React, { useState, useRef } from 'react';
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { UploadCloud, AlertCircle, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import Papa from 'papaparse';
import { Spinner } from '@/components/ui/spinner';
import { useSSUrlCollections } from '@/api/ssUrl';
import { axiosInstance } from '@/lib/axios';

interface CSVRow {
    url: string;
    image: string;
}

const SSUrlImport: React.FC = () => {
    const { data, isLoading, isError } = useSSUrlCollections();

    const [file, setFile] = useState<File | null>(null);
    const [bucketName, setBucketName] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [progress, setProgress] = useState(0);
    const [logs, setLogs] = useState<string[]>([]);
    const [errorLogs, setErrorLogs] = useState<string[]>([]);
    const [stats, setStats] = useState({
        total: 0,
        success: 0,
        errors: 0,
        notFound: 0
    });
    const logsEndRef = useRef<HTMLDivElement>(null);



    const addLog = (message: string) => {
        setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const addErrorLog = (message: string) => {
        setErrorLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    // Import mutation
    const importMutation = useMutation({
        mutationFn: async (data: { chunk: CSVRow[], bucketName: string }) => {
            const { data: responseData } = await axiosInstance.post('/ss-url/import', data);
            return responseData;
        },
        onSuccess: (data) => {
            // Update stats
            setStats(prev => {
                const newStats = {
                    total: prev.total + data.totalcount,
                    success: prev.success + data.success,
                    errors: prev.errors + data.errors,
                    notFound: prev.notFound + data.notfound
                };

                // Show toast with updated stats
                toast({
                    title: "Import completed",
                    description: `Processed ${newStats.total} entries with ${newStats.success} successful inserts and ${newStats.errors} errors.`
                });

                return newStats;
            });

            // Add logs
            if (data.errormessages) {
                addErrorLog(data.errormessages);
            }
            if (data.resultdebug) {
                addErrorLog(data.resultdebug);
            }
        },
        onError: (error) => {
            addErrorLog(`Error: ${error.message}`);
        }
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            addLog(`File selected: ${e.target.files[0].name}`);
        }
    };

    const validateCSV = (results: Papa.ParseResult<CSVRow>): boolean => {
        const headers = Object.keys(results.data[0] || {});

        if (!headers.includes('url') || !headers.includes('image')) {
            toast({
                variant: "destructive",
                title: "Invalid CSV format",
                description: "The CSV must have headers 'url' and 'image' (lowercase)"
            });
            return false;
        }

        return true;
    };

    const processCSV = async () => {
        if (!file || !bucketName) {
            toast({
                variant: "destructive",
                title: "Missing information",
                description: "Please select a file and enter a bucket name"
            });
            return;
        }

        setIsUploading(true);
        setProgress(0);
        setLogs([]);
        setErrorLogs([]);
        setStats({
            total: 0,
            success: 0,
            errors: 0,
            notFound: 0
        });

        addLog('Processing CSV file...');

        Papa.parse<CSVRow>(file, {
            header: true,
            complete: async (results) => {
                if (!validateCSV(results)) {
                    setIsUploading(false);
                    return;
                }

                const data = results.data.filter(row => row.url && row.image);
                const entriesPerChunk = 200;
                const chunks: CSVRow[][] = [];
                const CONCURRENT_CHUNKS = 5; // Number of chunks to process simultaneously

                // Split into chunks
                for (let i = 0; i < data.length; i += entriesPerChunk) {
                    chunks.push(data.slice(i, i + entriesPerChunk));
                }

                addLog(`Loaded ${chunks.length} chunks of up to ${entriesPerChunk} entries each.`);

                // Process chunks with delay between requests
                let completedChunks = 0;
                const processChunkWithRetry = async (chunk: CSVRow[], index: number, retryCount = 0) => {
                    try {
                        addLog(`Processing chunk #${index + 1}...`);
                        const result = await importMutation.mutateAsync({ chunk, bucketName });
                        addLog(`Chunk #${index + 1} completed. Success: ${result.success}, Errors: ${result.errors}, Not Found: ${result.notfound}`);
                        return result;
                    } catch (error) {
                        if (retryCount < 2) {
                            addLog(`Chunk #${index + 1} failed. Retrying (${retryCount + 1}/2)...`);
                            await new Promise(resolve => setTimeout(resolve, 1000));
                            return processChunkWithRetry(chunk, index, retryCount + 1);
                        } else {
                            addErrorLog(`Chunk #${index + 1} failed after 2 retries: ${error instanceof Error ? error.message : String(error)}`);
                            throw error;
                        }
                    }
                };

                // Process chunks in parallel with concurrency limit
                const processChunksInParallel = async () => {
                    const processChunk = async (index: number) => {
                        try {
                            await processChunkWithRetry(chunks[index], index);
                            completedChunks++;
                            setProgress(Math.floor((completedChunks / chunks.length) * 100));
                        } catch (error) {
                            addErrorLog(`Failed to process chunk #${index + 1}: ${error instanceof Error ? error.message : String(error)}`);
                        }
                    };

                    // Process chunks in batches of CONCURRENT_CHUNKS
                    for (let i = 0; i < chunks.length; i += CONCURRENT_CHUNKS) {
                        const batch = chunks.slice(i, i + CONCURRENT_CHUNKS);
                        const promises = batch.map((_, index) => processChunk(i + index));
                        await Promise.all(promises);
                        
                        // Small delay between batches to prevent overwhelming the server
                        if (i + CONCURRENT_CHUNKS < chunks.length) {
                            await new Promise(resolve => setTimeout(resolve, 200));
                        }
                    }
                };

                try {
                    await processChunksInParallel();
                    addLog('All chunks processed.');
                } catch (error) {
                    addErrorLog(`Error in parallel processing: ${error instanceof Error ? error.message : String(error)}`);
                } finally {
                    setIsUploading(false);
                }
            },
            error: (error) => {
                addErrorLog(`CSV parsing error: ${error.message}`);
                setIsUploading(false);
                toast({
                    variant: "destructive",
                    title: "CSV parsing failed",
                    description: error.message
                });
            }
        });
    };

    return (
        <div className="space-y-6 p-8">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">SS-URL Import</h1>
            </div>

            <Card className="p-6 space-y-6">
                <div>
                    <h2 className="text-xl font-medium mb-4">Import CSV Data</h2>
                    <p className="text-muted-foreground mb-4">
                        Upload a CSV file with URL and image data to import into the database.
                        <br />
                        <em>Note: The CSV file should have two headers called <strong>"url"</strong> and <strong>"image"</strong> all in lowercase.</em>
                    </p>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-4">
                        <div>
                            <label htmlFor="file-input" className="block text-sm font-medium mb-1">CSV File:</label>
                            <Input
                                id="file-input"
                                type="file"
                                accept=".csv"
                                onChange={handleFileChange}
                                disabled={isUploading}
                            />
                        </div>
                        <div>
                            <label htmlFor="bucket-name" className="block text-sm font-medium mb-1">Bucket Name:</label>
                            <Input
                                id="bucket-name"
                                type="text"
                                value={bucketName}
                                onChange={(e) => setBucketName(e.target.value)}
                                disabled={isUploading}
                                placeholder="Enter bucket name"
                            />
                        </div>
                        <Button
                            onClick={processCSV}
                            disabled={!file || !bucketName || isUploading}
                            className="w-full"
                        >
                            <UploadCloud className="mr-2 h-4 w-4" />
                            {isUploading ? <Spinner /> : 'Upload and Process'}

                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <h3 className="text-md font-medium mb-2">Import Statistics</h3>
                            <div className="grid grid-cols-2 gap-2">

                                
                                <div className="bg-muted rounded-md p-2 col-span-2">
                                    <p className="text-sm text-muted-foreground">Existing Records</p>
                                    <p className="text-xl font-bold">{data?.totalCount}</p>
                                </div>
                                <div className="bg-muted rounded-md p-2">
                                    <p className="text-sm text-muted-foreground">Total Records</p>
                                    <p className="text-xl font-bold">{stats.total}</p>
                                </div>
                                <div className="bg-green-50 dark:bg-green-900/20 rounded-md p-2">
                                    <p className="text-sm text-muted-foreground">Successful</p>
                                    <p className="text-xl font-bold text-green-600 dark:text-green-400">{stats.success}</p>
                                </div>
                                <div className="bg-red-50 dark:bg-red-900/20 rounded-md p-2">
                                    <p className="text-sm text-muted-foreground">Errors</p>
                                    <p className="text-xl font-bold text-red-600 dark:text-red-400">{stats.errors}</p>
                                </div>
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-md p-2">
                                    <p className="text-sm text-muted-foreground">Not Found</p>
                                    <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{stats.notFound}</p>
                                </div>
                            </div>
                        </div>

                        {isUploading && (
                            <div className="space-y-2">
                                <div className="flex justify-between mb-1">
                                    <span className="text-sm font-medium">Progress</span>
                                    <span className="text-sm">{progress}%</span>
                                </div>
                                <Progress value={progress} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            Processing Logs
                        </h3>
                        <Textarea
                            className="h-60 font-mono text-sm bg-muted resize-none"
                            readOnly
                            value={logs.join('\n')}
                        />
                        <div ref={logsEndRef} />
                    </div>

                    <div className="space-y-2">
                        <h3 className="flex items-center gap-2 font-medium">
                            <AlertCircle className="h-4 w-4 text-red-500" />
                            Error Logs
                        </h3>
                        <Textarea
                            className="h-60 font-mono text-sm bg-muted resize-none"
                            readOnly
                            value={errorLogs.map(log => log.replace(/<br>/g, '\n')).join('\n')}
                        />
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default SSUrlImport;
