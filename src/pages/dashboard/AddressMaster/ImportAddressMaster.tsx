import React from 'react';
import { useAddressMasterStats, useAddressMasterImport } from '@/api/addressMaster';
import { useImportProgress } from '@/hooks/useImportProgress';
import { toast } from 'sonner';
import { ImportProgress, ImportButton, FileUploadInstructions } from '@/components/Bostal';

const AddressMasterImport = () => {
    const { data: stats, isLoading: isLoadingStats } = useAddressMasterStats();
    const { mutate: startImport, isPending: isImporting } = useAddressMasterImport();
    
    const {
        progress,
        logs,
        isPolling,
        startPolling,
        resetProgress,
        addLog
    } = useImportProgress({
        progressEndpoint: '/address-master/import-progress',
        pollingInterval: 2000
    });

    const handleImport = () => {
        resetProgress();

        startImport(undefined, {
            onSuccess: () => {
                startPolling();
                addLog({
                    type: 'success',
                    message: 'Starting Address Master import process...'
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
                Address Master Import - {isLoadingStats ? 'Loading...' : stats?.toLocaleString()}
            </h2>

            <FileUploadInstructions
                uploadPath="home/lysnar/api.postalwiki.co.uk/imports/address_master/"
                formatDescription="CSV files should have 'F1' (postcode) in the first column and address fields in subsequent columns."
                additionalInfo="The system expects CSV files with a postcode in the first column (F1) and at least one address field. Order matters, and minimum 500 entries per import is recommended."
            />

            <div className="mb-6">
                <ImportButton
                    onClick={handleImport}
                    isImporting={isImporting}
                    isPolling={isPolling}
                    buttonText="Start Address Master Import"
                />
            </div>

            <ImportProgress
                progress={progress}
                logs={logs}
                title="Address Master Import Progress"
            />
        </div>
    );
};

export default AddressMasterImport;