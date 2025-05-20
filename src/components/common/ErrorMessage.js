// src/components/common/ErrorMessage.js
import React from 'react';

export const ErrorMessage = ({ 
    message, 
    onRetry = null,
    onReset = null 
}) => {
    return (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
            <div className="flex items-start">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3 flex-1">
                    <p className="text-sm text-red-600">{message}</p>
                </div>
            </div>
            {(onRetry || onReset) && (
                <div className="mt-4 flex gap-3">
                    {onRetry && (
                        <button
                            onClick={onRetry}
                            className="text-sm text-red-600 hover:text-red-500"
                        >
                            Попробовать снова
                        </button>
                    )}
                    {onReset && (
                        <button
                            onClick={onReset}
                            className="text-sm text-gray-600 hover:text-gray-500"
                        >
                            Сбросить
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default ErrorMessage;