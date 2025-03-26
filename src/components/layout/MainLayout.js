// src/components/layout/MainLayout.js (updated)
import React from 'react';
import Header from './Header';

const MainLayout = ({ children, title }) => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Header title={title} />
            <main className="flex-1 pt-4">
                {children}
            </main>
        </div>
    );
};

export default MainLayout;