import React from 'react';

const LoadingIndicator = ({ message = 'Загрузка...' }) => {
    return (
        <div className="center-absolute flex flex-col items-center gap-4">
            <div className="loading-spinner"></div>
            <div className="text-gray-600">{message}</div>
        </div>
    );
};

export default LoadingIndicator;