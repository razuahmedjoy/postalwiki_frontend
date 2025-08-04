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
            <p>
                Upload CSV files to the server in{' '}
                <span className="font-bold dark:bg-black p-1 text-sm">
                    {uploadPath}
                </span>
            </p>
            <p>{formatDescription}</p>
            
            {formatImage && (
                <img 
                    src={formatImage} 
                    alt={formatImageAlt || "CSV Format"} 
                    className="w-1/3 mt-2" 
                />
            )}
            
            {additionalInfo && (
                <div className="mt-4 rounded-md">
                    <h3 className="font-semibold text-black mb-2">Additional Information:</h3>
                    <p className="text-sm text-gray-400">{additionalInfo}</p>
                </div>
            )}
        </div>
    );
};

export default FileUploadInstructions; 