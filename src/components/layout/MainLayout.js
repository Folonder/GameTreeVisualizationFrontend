import React from 'react';
import Header from './Header';

const MainLayout = ({ children, title }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <Header title={title} />
            <main>
                <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;