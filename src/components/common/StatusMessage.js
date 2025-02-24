import React from 'react';

const StatusMessage = ({ 
    type = 'info', 
    message, 
    className = '' 
}) => {
    const types = {
        info: 'bg-blue-100 text-blue-700 border-blue-200',
        success: 'bg-green-100 text-green-700 border-green-200',
        error: 'bg-red-100 text-red-700 border-red-200',
        warning: 'bg-yellow-100 text-yellow-700 border-yellow-200'
    };

    if (!message) return null;

    return (
        <div className={`p-4 rounded-lg border ${types[type]} ${className}`}>
            {message}
        </div>
    );
};

export default StatusMessage;