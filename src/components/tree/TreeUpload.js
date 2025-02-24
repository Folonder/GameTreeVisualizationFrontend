import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Card from '../common/Card';

const TreeUpload = ({ onUpload }) => {
    const onDrop = useCallback(async (acceptedFiles) => {
        const file = acceptedFiles[0];
        if (!file) return;

        try {
            const text = await file.text();
            onUpload(text);
        } catch (err) {
            console.error('Error reading file:', err);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/json': ['.json']
        },
        multiple: false
    });

    return (
        <Card>
            <div 
                {...getRootProps()} 
                className={`
                    p-6 border-2 border-dashed rounded-lg text-center cursor-pointer
                    transition-colors duration-200
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400'}
                `}
            >
                <input {...getInputProps()} />
                <div className="space-y-2">
                    <p className="text-gray-600">
                        {isDragActive 
                            ? 'Drop the JSON file here'
                            : 'Drag & drop a JSON file here, or click to select'
                        }
                    </p>
                    <p className="text-sm text-gray-400">
                        Only JSON files are accepted
                    </p>
                </div>
            </div>
        </Card>
    );
};

export default TreeUpload;