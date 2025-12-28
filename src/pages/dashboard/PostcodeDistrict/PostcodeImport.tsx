import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { usePostcodeImportStart, usePostcodeUpload, usePostcodeImportStatus } from '@/api/postcodeDistrict';
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import exampleImage from '@/assets/images/postcode_districts/csv_format.png';

const PostcodeImport: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [jobId, setJobId] = useState<string | null>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing'>('idle');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Hooks
    const startImportMutation = usePostcodeImportStart();
    const uploadMutation = usePostcodeUpload();
    const { data: stats, isError } = usePostcodeImportStatus(jobId);

    // Derived Status
    const isProcessing = uploadStatus === 'processing' || (stats?.status === 'processing');
    const isCompleted = stats?.status === 'completed';
    const isFailed = stats?.status === 'failed' || isError;

    // Effects
    useEffect(() => {
        if (isCompleted) {
            toast.success('Import completed successfully!');
            setUploadStatus('idle'); // Allow reset
        }
        if (isFailed) {
            toast.error('Import process failed.');
            setUploadStatus('idle');
        }
    }, [isCompleted, isFailed]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.size > 100 * 1024 * 1024) {
                toast.error('File too large. Max size is 100MB.');
                return;
            }
            setFile(selectedFile);
            // Reset state
            setJobId(null);
            setUploadProgress(0);
            setUploadStatus('idle');
        }
    };

    const handleStartImport = async () => {
        if (!file) return;

        try {
            // 1. Start Job
            setUploadStatus('uploading');
            const { jobId: newJobId } = await startImportMutation.mutateAsync();
            setJobId(newJobId);

            // 2. Upload
            await uploadMutation.mutateAsync({
                jobId: newJobId,
                file: file,
                onUploadProgress: (progressEvent) => {
                    if (progressEvent.total) {
                        const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                        setUploadProgress(percent);
                    }
                }
            });

            // 3. Processing started
            setUploadStatus('processing');
            toast.info('File uploaded. Processing started...');

        } catch (error: any) {
            console.error('Import error', error);
            setUploadStatus('idle');
            toast.error('Failed to start import.');
        }
    };

    const resetForm = () => {
        setFile(null);
        setJobId(null);
        setUploadProgress(0);
        setUploadStatus('idle');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // UI Status Helper
    const currentStatus = isCompleted ? 'completed' : isFailed ? 'failed' : uploadStatus;

    return (
        <div className="space-y-6 p-6">
            <h1 className="text-3xl font-bold tracking-tight">Postcode District Import</h1>
            <Card>
                <CardHeader>
                    <CardTitle>Import CSV</CardTitle>
                    <CardDescription>Upload a CSV file containing Postcode and District columns.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Format Guide */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <h3 className="text-sm font-semibold mb-2">CSV Format Requirements</h3>
                                <ul className="text-xs text-muted-foreground list-disc pl-4 space-y-1">
                                    <li>File type must be <strong>.csv</strong></li>
                                    <li>Columns: <strong>District Name</strong>, <strong>Postcode</strong></li>
                                    <li>Order: First column is District, second is Postcode</li>
                                    <li>Headers are optional (system auto-detects)</li>
                                    <li>Max file size: <strong>20MB</strong></li>
                                </ul>
                            </div>
                            <div className="flex-none">
                                <h3 className="text-sm font-semibold mb-2">Example Format</h3>
                                <div className="border rounded-md overflow-hidden shadow-sm">
                                    <img
                                        src={exampleImage}
                                        alt="CSV Example Format"
                                        className="max-h-24 w-auto object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* File Input */}
                    <div className="flex items-center gap-4">
                        <Input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            disabled={uploadStatus !== 'idle'}
                            className="max-w-sm"
                        />
                        <Button
                            onClick={handleStartImport}
                            disabled={!file || uploadStatus !== 'idle'}
                        >
                            {uploadStatus === 'uploading' ? 'Uploading...' : 'Start Import'}
                        </Button>
                        {uploadStatus === 'idle' && (jobId || file) && (
                            <Button variant="outline" onClick={resetForm}>Reset</Button>
                        )}
                    </div>

                    {/* Progress Area */}
                    {(currentStatus !== 'idle') && (
                        <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="font-medium flex items-center gap-2">
                                    {uploadStatus === 'uploading' && <Upload className="h-4 w-4 animate-bounce" />}
                                    {(currentStatus === 'processing') && <Loader2 className="h-4 w-4 animate-spin" />}
                                    {isCompleted && <CheckCircle className="h-4 w-4 text-green-500" />}
                                    Status: <span className="capitalize">{currentStatus}</span>
                                </h3>
                                {stats && <span className="text-sm text-muted-foreground">Processed: {stats.totalProcessed.toLocaleString()}</span>}
                            </div>

                            {/* Upload Bar */}
                            {uploadStatus === 'uploading' && (
                                <div className="space-y-1">
                                    <div className="flex justify-between text-xs">
                                        <span>Upload Progress</span>
                                        <span>{uploadProgress}%</span>
                                    </div>
                                    <Progress value={uploadProgress} className="h-2" />
                                </div>
                            )}

                            {/* Statistics */}
                            {stats && (
                                <div className="grid grid-cols-3 gap-4 text-center mt-4">
                                    <div className="bg-background p-3 rounded-md border">
                                        <div className="text-2xl font-bold">{stats.insertedCount.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">Inserted</div>
                                    </div>
                                    <div className="bg-background p-3 rounded-md border">
                                        <div className="text-2xl font-bold text-red-500">{stats.errors.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">Errors</div>
                                    </div>
                                    <div className="bg-background p-3 rounded-md border">
                                        <div className="text-2xl font-bold">{stats.totalProcessed.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">Total Rows</div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Logs */}
                    {stats && stats.errorLogs && stats.errorLogs.length > 0 && (
                        <div className="mt-4">
                            <h4 className="text-sm font-medium mb-2 flex items-center gap-2 text-red-500">
                                <AlertCircle className="h-4 w-4" /> Recent Errors
                            </h4>
                            <div className="bg-slate-950 text-slate-50 p-4 rounded-md text-xs font-mono h-48 overflow-y-auto">
                                {stats.errorLogs.map((log, i) => (
                                    <div key={i} className="border-b border-slate-800 py-1 last:border-0">{log}</div>
                                ))}
                            </div>
                        </div>
                    )}

                </CardContent>
            </Card>
        </div>
    );
};

export default PostcodeImport;
