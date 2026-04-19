import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRMAddressStats, useRMAddressImport, useRMAddressImportFiles, useUploadRMAddressFiles } from '@/api/rmAddress';
import { useImportProgress } from '@/hooks/useImportProgress';
import { toast } from 'sonner';
import { ImportProgress, ImportButton, FileUploadInstructions } from '@/components/Bostal';
import { CSV_UPLOAD_PATHS } from '@/lib/constant';

const RMAddressImport = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { data: stats, isLoading: isLoadingStats, refetch: refetchStats } = useRMAddressStats();
  const { mutate: startImport, isPending: isImporting } = useRMAddressImport();
  const {
    data: importFiles,
    isLoading: isLoadingImportFiles,
    refetch: refetchImportFiles
  } = useRMAddressImportFiles();
  const { mutateAsync: uploadSingleFile, isPending: isUploading } = useUploadRMAddressFiles();

  const {
    progress,
    logs,
    isPolling,
    startPolling,
    resetProgress,
    addLog
  } = useImportProgress({
    progressEndpoint: '/rm-address/import-progress',
    pollingInterval: 2000
  });

  useEffect(() => {
    if (!progress.isComplete) return;
    refetchImportFiles();
    refetchStats();
  }, [progress.isComplete, refetchImportFiles, refetchStats]);

  const pendingFiles = importFiles?.files || [];
  const pendingCount = importFiles?.pendingCount || 0;
  const canStartImport = pendingCount > 0;

  const selectedFileSummary = useMemo(() => {
    if (!selectedFiles.length) return 'No files selected';
    if (selectedFiles.length === 1) return selectedFiles[0].name;
    return `${selectedFiles.length} files selected`;
  }, [selectedFiles]);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, index);
    return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []).filter((file) => file.name.toLowerCase().endsWith('.csv'));
    setSelectedFiles(files);
  };

  const handleUploadFiles = async () => {
    if (!selectedFiles.length) {
      toast.error('Please select one or more CSV files first.');
      return;
    }

    setUploadProgress(0);

    let uploadedCount = 0;

    for (let index = 0; index < selectedFiles.length; index += 1) {
      const file = selectedFiles[index];

      try {
        await uploadSingleFile({
          file,
          onProgress: (filePercent) => {
            const overall = ((index + filePercent / 100) / selectedFiles.length) * 100;
            setUploadProgress(Math.round(overall));
          }
        });

        uploadedCount += 1;
        addLog({
          type: 'success',
          message: `Uploaded file ${index + 1}/${selectedFiles.length}: ${file.name}`
        });
      } catch (error: any) {
        const message = error?.response?.data?.message || error?.response?.data?.error || error.message || 'Upload failed';
        addLog({ type: 'error', message: `Failed on ${file.name}: ${message}` });
        toast.error(`Upload failed on ${file.name}: ${message}`);
        return;
      }
    }

    setUploadProgress(100);
    addLog({
      type: 'success',
      message: `Uploaded ${uploadedCount} file(s) to RM Address import directory.`
    });
    toast.success(`Uploaded ${uploadedCount} file(s) successfully.`);
    setSelectedFiles([]);
    refetchImportFiles();

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    setTimeout(() => setUploadProgress(0), 600);
  };

  const handleImport = () => {
    if (!canStartImport) {
      toast.error('No pending CSV files found to import.');
      return;
    }

    resetProgress();

    startImport(undefined, {
      onSuccess: () => {
        startPolling();
        addLog({
          type: 'success',
          message: 'Starting RM Address import process...'
        });
      },
      onError: (error: any) => {
        addLog({
          type: 'error',
          message: error?.response?.data?.message || error.message || 'Import failed'
        });
        toast.error('Import failed: ' + (error?.response?.data?.message || error.message));
      }
    });
  };

  return (
    <div className="p-5 mx-auto">
      <h2 className="text-2xl font-bold mb-4">
        RM Address Import - {isLoadingStats ? 'Loading...' : stats?.addressMasterMergedCount?.toLocaleString() || 0}
      </h2>

      <div className="mb-4 text-sm text-muted-foreground">
        <p>Address Master Merged Count: {stats?.addressMasterMergedCount?.toLocaleString() || 0}</p>
      </div>

      <FileUploadInstructions
        uploadPath={CSV_UPLOAD_PATHS.RM_ADDRESS_IMPORTS}
        formatDescription="Upload one or multiple CSV files directly from this page, then click Start Import."
        additionalInfo="Expected format: first column is postcode, second column is address text (or multiple address columns). Upload limit: up to 50 CSV files per upload, 100 MB max per file. Rows missing district mapping in postcode_district are skipped and shown in logs."
      />

      <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-900/40">
        <h3 className="text-lg font-semibold mb-3">CSV Upload</h3>
        <p className="text-sm text-muted-foreground mb-3">
          Upload limits: up to <span className="font-semibold text-foreground">50 files</span> per upload, <span className="font-semibold text-foreground">100 MB</span> per file.
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          Files are uploaded one-by-one to reduce large-request failures on production gateways.
        </p>
        <div className="flex flex-col gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            multiple
            onChange={handleFilesSelected}
            className="block w-full rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 text-sm text-gray-900 dark:text-gray-100 file:mr-4 file:rounded-md file:border-0 file:bg-blue-600 file:px-4 file:py-2 file:text-white hover:file:bg-blue-700"
          />

          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">{selectedFileSummary}</p>
            <button
              type="button"
              onClick={handleUploadFiles}
              disabled={isUploading || selectedFiles.length === 0}
              className={`px-4 py-2 rounded-md text-white ${
                isUploading || selectedFiles.length === 0
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400'
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload CSV'}
            </button>
          </div>

          {(isUploading || uploadProgress > 0) && (
            <div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Upload progress: {uploadProgress}%</p>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 border border-gray-200 dark:border-gray-700 rounded-md p-4 bg-white dark:bg-gray-900/40">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold">Pending Import Files</h3>
          <button
            type="button"
            onClick={() => refetchImportFiles()}
            className="text-sm px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            Refresh
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-3">
          Pending files in import directory: <span className="font-semibold text-foreground">{pendingCount}</span>
        </p>

        {isLoadingImportFiles ? (
          <p className="text-sm text-gray-500 dark:text-gray-300">Loading import files...</p>
        ) : pendingFiles.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-300">No pending CSV files. Upload files to enable import.</p>
        ) : (
          <div className="max-h-64 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2">Filename</th>
                  <th className="text-left px-3 py-2">Size</th>
                  <th className="text-left px-3 py-2">Updated</th>
                  <th className="text-left px-3 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {pendingFiles.map((file) => (
                  <tr key={file.filename} className="border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="px-3 py-2 font-medium">{file.filename}</td>
                    <td className="px-3 py-2">{formatBytes(file.sizeBytes)}</td>
                    <td className="px-3 py-2">{new Date(file.lastModified).toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <span className="inline-flex rounded-full bg-amber-100 text-amber-800 dark:bg-amber-300/20 dark:text-amber-200 px-2 py-0.5 text-xs font-semibold">
                        Pending
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mb-6">
        <ImportButton
          onClick={handleImport}
          isImporting={isImporting}
          isPolling={isPolling}
          isDisabled={!canStartImport}
          buttonText="Import RM Address"
          loadingText="Starting Import..."
          importingText="Importing..."
          disabledText="No Pending Files to Import"
        />
      </div>

      <ImportProgress progress={progress} logs={logs} title="RM Address Import Progress" />
    </div>
  );
};

export default RMAddressImport;
