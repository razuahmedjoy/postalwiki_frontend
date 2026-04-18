import React from 'react';
import { useRMAddressStats, useRMAddressImport } from '@/api/rmAddress';
import { useImportProgress } from '@/hooks/useImportProgress';
import { toast } from 'sonner';
import { ImportProgress, ImportButton, FileUploadInstructions } from '@/components/Bostal';
import { CSV_UPLOAD_PATHS } from '@/lib/constant';

const RMAddressImport = () => {
  const { data: stats, isLoading: isLoadingStats } = useRMAddressStats();
  const { mutate: startImport, isPending: isImporting } = useRMAddressImport();

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

  const handleImport = () => {
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
        formatDescription="Upload one or multiple CSV files into the server folder, then click Start Import."
        additionalInfo="Expected format: first column is postcode, second column is address text (or multiple address columns). Rows missing district mapping in postcode_district are skipped and shown in logs."
      />

      <div className="mb-6">
        <ImportButton
          onClick={handleImport}
          isImporting={isImporting}
          isPolling={isPolling}
          buttonText="Import RM Address"
          loadingText="Starting Import..."
          importingText="Importing..."
        />
      </div>

      <ImportProgress progress={progress} logs={logs} title="RM Address Import Progress" />
    </div>
  );
};

export default RMAddressImport;
