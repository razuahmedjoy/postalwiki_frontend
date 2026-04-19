import React from 'react';

interface FileUploadInstructionsProps {
    uploadPath: string;
    formatDescription: string;
    formatImage?: string;
    formatImageAlt?: string;
    additionalInfo?: string;
}

const FileUploadInstructions: React.FC<FileUploadInstructionsProps> = ({
    uploadPath,
    formatDescription,
    formatImage,
    formatImageAlt,
    additionalInfo
}) => {
    return (
        <div className="mb-6">
            <p className="text-gray-700 dark:text-gray-200">
                Upload CSV files to the server in{' '}
                <span className="font-bold bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded p-1 text-sm">
                    {uploadPath}
                </span>
            </p>
            <p className="text-gray-700 dark:text-gray-200 mt-1">{formatDescription}</p>
            
            {formatImage && (
                <img 
                    src={formatImage} 
                    alt={formatImageAlt || "CSV Format"} 
                    className="w-1/3 mt-2" 
                />
            )}
            
            {additionalInfo && (
                <div className="mt-4 rounded-md border border-gray-200 dark:border-gray-700 p-3 bg-white dark:bg-gray-900/40">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Additional Information:</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{additionalInfo}</p>
                </div>
            )}
        </div>
    );
};

export default FileUploadInstructions; 