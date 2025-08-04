import React from 'react';
import { useBostalStats, useBostalImport } from '@/api/bostal';
import { useImportProgress } from '@/hooks/useImportProgress';
import { toast } from 'sonner';
import { ImportProgress, ImportButton, FileUploadInstructions } from '@/components/Bostal';

const BostalImport = () => {
    const { data: stats, isLoading: isLoadingStats } = useBostalStats();
    const { mutate: startImport, isPending: isImporting } = useBostalImport();
    
    const {
        progress,
        logs,
        isPolling,
        startPolling,
        resetProgress,
        addLog
    } = useImportProgress({
        progressEndpoint: '/botsol/import-progress',
        pollingInterval: 2000
    });

    const handleImport = () => {
        resetProgress();

        startImport(undefined, {
            onSuccess: () => {
                startPolling();
                addLog({
                    type: 'success',
                    message: 'Starting Bostal import process...'
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
                Bostal Import - {isLoadingStats ? 'Loading...' : stats?.toLocaleString()}
            </h2>

            <FileUploadInstructions
                uploadPath="home/lysnar/api.postalwiki.co.uk/imports/botsol/"
                formatDescription="Make sure each file has the correct column format for Bostal data."
                additionalInfo="Please ensure your CSV files contain the appropriate columns for Bostal data. The exact column structure should match your backend import requirements."
            />

            <div className="mb-6">
                <ImportButton
                    onClick={handleImport}
                    isImporting={isImporting}
                    isPolling={isPolling}
                    buttonText="Import Bostal Data"
                    loadingText="Starting Import..."
                    importingText="Importing..."
                />
            </div>

            <ImportProgress
                progress={progress}
                logs={logs}
                title="Current Progress"
            />
        </div>
    );
};

export default BostalImport;