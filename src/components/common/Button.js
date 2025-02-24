import React from 'react';

const Button = ({ 
    children, 
    onClick, 
    type = 'button', 
    variant = 'primary', 
    disabled = false,
    className = '' 
}) => {
    const baseClasses = 'px-4 py-2 rounded-md font-medium focus:outline-none transition duration-200';
    const variants = {
        primary: 'bg-blue-500 hover:bg-blue-600 text-white disabled:bg-blue-300',
        secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100'
    };

    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled}
            className={`${baseClasses} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    );
};

export default Button;