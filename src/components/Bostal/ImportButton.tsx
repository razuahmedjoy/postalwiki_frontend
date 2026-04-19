import React from 'react';

interface ImportButtonProps {
    onClick: () => void;
    isImporting: boolean;
    isPolling: boolean;
    isDisabled?: boolean;
    buttonText?: string;
    loadingText?: string;
    importingText?: string;
    disabledText?: string;
    className?: string;
}

const ImportButton: React.FC<ImportButtonProps> = ({
    onClick,
    isImporting,
    isPolling,
    isDisabled = false,
    buttonText = "Import Data",
    loadingText = "Starting Import...",
    importingText = "Importing...",
    disabledText = "Import Data",
    className = ""
}) => {
    const disabled = isImporting || isPolling || isDisabled;
    const buttonContent = isImporting
        ? loadingText
        : isPolling
            ? importingText
            : isDisabled
                ? disabledText
                : buttonText;

    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className={`px-5 py-2.5 text-base font-medium rounded-md text-white transition-colors duration-200 ${className} ${
                disabled
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700 cursor-pointer'
            }`}
        >
            {buttonContent}
        </button>
    );
};

export default ImportButton; 