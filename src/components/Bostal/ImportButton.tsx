import React from 'react';

interface ImportButtonProps {
    onClick: () => void;
    isImporting: boolean;
    isPolling: boolean;
    buttonText?: string;
    loadingText?: string;
    importingText?: string;
    className?: string;
}

const ImportButton: React.FC<ImportButtonProps> = ({
    onClick,
    isImporting,
    isPolling,
    buttonText = "Import Data",
    loadingText = "Starting Import...",
    importingText = "Importing...",
    className = ""
}) => {
    const isDisabled = isImporting || isPolling;
    const buttonContent = isImporting ? loadingText : isPolling ? importingText : buttonText;

    return (
        <button
            onClick={onClick}
            disabled={isDisabled}
            className={`px-5 py-2.5 text-base font-medium rounded-md text-white transition-colors duration-200 ${className} ${
                isDisabled
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
        >
            {buttonContent}
        </button>
    );
};

export default ImportButton; 