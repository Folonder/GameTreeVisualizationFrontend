// src/components/tree/TreeUpload.js
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';

const TreeUpload = ({ onUpload }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setError(null);
        setIsLoading(true);

        try {
            // Проверяем размер файла (например, макс. 10MB)
            if (file.size > 10 * 1024 * 1024) {
                throw new Error('File size exceeds 10MB limit');
            }

            const text = await file.text();
            let data;

            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error('Invalid JSON format');
            }

            onUpload(data);
        } catch (err) {
            setError(err.message);
            console.error('Error reading file:', err);
        } finally {
            setIsLoading(false);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
        onDrop,
        accept: {
            'application/json': ['.json']
        },
        multiple: false,
        disabled: isLoading
    });

    const getBorderColor = () => {
        if (isDragReject) return 'border-red-500';
        if (isDragActive) return 'border-blue-500';
        return 'border-gray-300 hover:border-blue-400';
    };

    return (
        <div className="space-y-4">
            <div 
                {...getRootProps()} 
                className={`
                    p-8 border-2 border-dashed rounded-lg text-center cursor-pointer
                    transition-colors duration-200 bg-white
                    ${getBorderColor()}
                    ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isDragActive ? 'bg-blue-50' : ''}
                    ${isDragReject ? 'bg-red-50' : ''}
                `}
            >
                <input {...getInputProps()} disabled={isLoading} />
                
                {isLoading ? (
                    <div className="space-y-3">
                        <div className="flex justify-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        </div>
                        <p className="text-gray-600">Processing file...</p>
                    </div>
                ) : isDragReject ? (
                    <div className="space-y-3">
                        <div className="flex justify-center text-red-500">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <p className="text-red-500">Only JSON files are accepted</p>
                    </div>
                ) : isDragActive ? (
                    <div className="space-y-3">
                        <div className="flex justify-center text-blue-500">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <p className="text-blue-500">Drop the file here</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-center text-gray-400">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-gray-600">
                                Drag & drop a JSON file here, or click to select
                            </p>
                            <p className="text-sm text-gray-400 mt-1">
                                Maximum file size: 10MB
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TreeUpload;