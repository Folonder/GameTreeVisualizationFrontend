// src/components/layout/Header.js (updated)
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Button from '../common/Button';

const Header = ({ title }) => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Display title with a fallback
    const displayTitle = title || "Game Tree Visualization";
    
    return (
        <header className="bg-white shadow">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">
                    {displayTitle}
                </h1>
                
                <div className="flex space-x-4">
                    {location.pathname !== '/' && (
                        <Button
                            onClick={() => navigate('/')}
                            variant="secondary"
                        >
                            Home
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;