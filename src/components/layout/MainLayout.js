import React from 'react';

const MainLayout = ({ children }) => {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow">
                <div className="max-w-7xl mx-auto py-4 px-4">
                    <h1 className="text-2xl font-bold text-gray-900">
                        Game Tree Visualization
                    </h1>
                </div>
            </header>
            <main>
                <div className="max-w-7xl mx-auto py-6 px-4">
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;