import React, { useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Loader2, Upload, StopCircle, Download, FileText, CircleAlert } from 'lucide-react';
import {
  downloadPostcodeCheckResult,
  usePostcodeCheckJobStart,
  usePostcodeCheckJobStatus,
  useStopPostcodeCheckJob,
  useUploadPostcodeCheckFile,
} from '@/api/postcodeDistrict';

const formatFileSize = (bytes: number) => {
  if (!bytes) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** index).toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
};

const formatRowsPerSecond = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return '0 rows/sec';
  return `${value.toFixed(value >= 100 ? 0 : 1)} rows/sec`;
};

const formatEta = (seconds: number | null) => {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return '-';

  const rounded = Math.max(0, Math.round(seconds));
  if (rounded === 0) return 'less than 1 min';

  const hours = Math.floor(rounded / 3600);
  const minutes = Math.floor((rounded % 3600) / 60);
  const remainingSeconds = rounded % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`;
  }

  return `${remainingSeconds}s`;
};

const CheckPostcode: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { mutateAsync: startJob, isPending: isStarting } = usePostcodeCheckJobStart();
  const { mutateAsync: uploadFile, isPending: isUploading } = useUploadPostcodeCheckFile();
  const { mutateAsync: stopJob, isPending: isStopping } = useStopPostcodeCheckJob();
  const { data: jobStatus } = usePostcodeCheckJobStatus(jobId);

  const activeStatus = jobStatus?.status ?? 'pending';
  const isRunning = activeStatus === 'processing';
  const isFinished = activeStatus === 'completed' || activeStatus === 'stopped' || activeStatus === 'failed';

  const progressPercent = useMemo(() => {
    if (!jobStatus?.inputCount) return 0;
    return Math.min(100, Math.round(((jobStatus.totalProcessed || 0) * 100) / jobStatus.inputCount));
  }, [jobStatus?.inputCount, jobStatus?.totalProcessed]);

  const rateAndEta = useMemo(() => {
    if (!jobStatus?.createdAt || !jobStatus?.inputCount) {
      return { rowsPerSecond: 0, etaSeconds: null };
    }

    const startedAt = new Date(jobStatus.createdAt).getTime();
    const elapsedSeconds = Math.max((Date.now() - startedAt) / 1000, 1);
    const processed = jobStatus.totalProcessed || 0;
    const rowsPerSecond = processed / elapsedSeconds;
    const remainingRows = Math.max(jobStatus.inputCount - processed, 0);
    const etaSeconds = rowsPerSecond > 0 ? remainingRows / rowsPerSecond : null;

    return { rowsPerSecond, etaSeconds };
  }, [jobStatus?.createdAt, jobStatus?.inputCount, jobStatus?.totalProcessed, jobStatus?.status]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files?.[0] || null;
    if (file) {
      setSelectedFile(file);
    }
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleRunCheck = async () => {
    if (!selectedFile) {
      toast.error('Please select a CSV file first.');
      return;
    }

    if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
      toast.error('Only CSV files are allowed.');
      return;
    }

    try {
      setUploadProgress(0);
      const started = await startJob();
      setJobId(started.jobId);

      await uploadFile({
        jobId: started.jobId,
        file: selectedFile,
        onUploadProgress: (event) => {
          if (!event.total) return;
          setUploadProgress(Math.round((event.loaded * 100) / event.total));
        },
      });

      toast.success('File uploaded. Background check started.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to start postcode check';
      toast.error(message);
    }
  };

  const handleStop = async () => {
    if (!jobId) return;

    try {
      await stopJob(jobId);
      toast.success('Stop requested. The current batch will halt shortly.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to stop the job';
      toast.error(message);
    }
  };

  const handleDownload = async () => {
    if (!jobId) return;

    try {
      setIsDownloading(true);
      const { blob, fileName } = await downloadPostcodeCheckResult(jobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Missing postcode CSV downloaded.');
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || 'Failed to download result file';
      toast.error(message);
    } finally {
      setIsDownloading(false);
    }
  };

  const statusLabel = activeStatus === 'processing'
    ? 'Running'
    : activeStatus === 'completed'
      ? 'Completed'
      : activeStatus === 'stopped'
        ? 'Stopped'
        : activeStatus === 'failed'
          ? 'Failed'
          : 'Ready';

  const statusTone = activeStatus === 'processing'
    ? 'bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/30'
    : activeStatus === 'completed'
      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
      : activeStatus === 'stopped'
        ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30'
        : activeStatus === 'failed'
          ? 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-500/30'
          : 'bg-muted text-muted-foreground border-border';

  const canDownload = Boolean(jobStatus?.resultFilePath && isFinished && activeStatus !== 'failed');
  const sampleMissing = jobStatus?.sampleMissingPostcodes || [];

  return (
    <div className="mx-auto w-full max-w-4xl space-y-4 p-4 sm:p-6">
      <Card className="border-border/60 shadow-sm">
        <CardHeader className="space-y-2 pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-xl">Check Postcodes</CardTitle>
              <CardDescription>
                Upload a CSV with one postcode per row. The job runs server-side, shows progress, and exports the missing postcodes.
              </CardDescription>
            </div>
            <div className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${statusTone}`}>
              {statusLabel}
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">CSV file</label>
              <div
                role="button"
                tabIndex={0}
                onClick={openFilePicker}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openFilePicker();
                  }
                }}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragEnter={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`cursor-pointer rounded-lg border border-dashed px-4 py-5 transition-colors ${isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-muted/20 hover:border-primary/60 hover:bg-muted/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Drop CSV here or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      One postcode per row. Large files are processed server-side.
                    </p>
                  </div>
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Supported format: a CSV list of postcodes. The first column is used and header rows are ignored.
              </p>
            </div>

            <Button
              onClick={handleRunCheck}
              disabled={!selectedFile || isStarting || isUploading || isRunning}
              className="min-w-[180px]"
            >
              {(isStarting || isUploading) ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {isStarting ? 'Starting...' : 'Uploading...'}
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Run Check
                </>
              )}
            </Button>
          </div>

          {selectedFile && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-muted/20 px-3 py-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                {selectedFile.name}
              </span>
              <span className="text-muted-foreground">{formatFileSize(selectedFile.size)}</span>
              {jobId && <span className="text-muted-foreground">Job: {jobId}</span>}
            </div>
          )}

          {(isStarting || isUploading || isRunning) && (
            <div className="space-y-2 rounded-lg border bg-background p-3">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{isUploading ? 'Uploading file' : 'Processing file'}</span>
                <span>{isUploading ? `${uploadProgress}%` : `${progressPercent}%`}</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${isUploading ? uploadProgress : progressPercent}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {jobStatus?.stage ? `Stage: ${jobStatus.stage}` : 'Waiting for server response...'}
              </p>
              {isRunning && (
                <div className="grid gap-2 sm:grid-cols-2">
                  <Metric label="Rate" value={formatRowsPerSecond(rateAndEta.rowsPerSecond)} />
                  <Metric label="ETA" value={formatEta(rateAndEta.etaSeconds)} />
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={handleStop} disabled={!jobId || !isRunning || isStopping}>
              {isStopping ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Stopping...
                </>
              ) : (
                <>
                  <StopCircle className="mr-2 h-4 w-4" />
                  Stop Job
                </>
              )}
            </Button>

            <Button variant="secondary" onClick={handleDownload} disabled={!canDownload || isDownloading}>
              {isDownloading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download Missing CSV
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {jobStatus && (
        <Card className="border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Progress</CardTitle>
            <CardDescription>Live summary from the background job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Rows read" value={jobStatus.inputCount ?? jobStatus.totalProcessed} />
              <Metric label="Unique postcodes" value={jobStatus.uniqueCount ?? 0} />
              <Metric label="Found" value={jobStatus.foundCount ?? jobStatus.insertedCount ?? 0} tone="emerald" />
              <Metric label="Missing" value={jobStatus.missingCount ?? 0} tone="amber" />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Invalid rows" value={jobStatus.errorCount ?? 0} tone="red" />
              <Metric label="Stage" value={jobStatus.stage || '-'} />
              <Metric label="Status" value={jobStatus.status} />
              <Metric label="Output" value={jobStatus.resultFilePath ? 'Ready' : 'Pending'} />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Rate" value={formatRowsPerSecond(rateAndEta.rowsPerSecond)} />
              <Metric label="ETA" value={formatEta(rateAndEta.etaSeconds)} />
              <Metric label="Upload" value={selectedFile ? formatFileSize(selectedFile.size) : '-'} />
              <Metric label="Progress" value={`${progressPercent}%`} />
            </div>

            <div className="rounded-lg border bg-muted/20 p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div>
                  <h3 className="text-sm font-medium">Missing postcode sample</h3>
                  <p className="text-xs text-muted-foreground">First few missing rows only. Download the CSV for the full list.</p>
                </div>
                {sampleMissing.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <CircleAlert className="h-3.5 w-3.5" />
                    {sampleMissing.length} shown
                  </span>
                )}
              </div>

              {sampleMissing.length === 0 ? (
                <p className="text-sm text-muted-foreground">No missing postcodes captured yet.</p>
              ) : (
                <div className="max-h-56 overflow-y-auto rounded-md border bg-background p-3">
                  <pre className="whitespace-pre-wrap break-words text-xs leading-5">{sampleMissing.join('\n')}</pre>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

const Metric = ({ label, value, tone = 'default' }: { label: string; value: React.ReactNode; tone?: 'default' | 'emerald' | 'amber' | 'red' }) => {
  const toneClass =
    tone === 'emerald'
      ? 'text-emerald-600 dark:text-emerald-400'
      : tone === 'amber'
        ? 'text-amber-600 dark:text-amber-400'
        : tone === 'red'
          ? 'text-red-600 dark:text-red-400'
          : 'text-foreground';

  return (
    <div className="rounded-lg border bg-background p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${toneClass}`}>{typeof value === 'number' ? value.toLocaleString() : value}</p>
    </div>
  );
};

export default CheckPostcode;
