import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TreeView from '../components/tree/TreeView';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { ErrorMessage } from '../components/common/ErrorMessage';

const TreePage = () => {
    const navigate = useNavigate();
    const [treeData, setTreeData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const loadData = () => {
            try {
                setIsLoading(true);
                const storedData = localStorage.getItem('treeData');

                if (!storedData) {
                    setError('Данные дерева отсутствуют. Пожалуйста, сначала загрузите файл.');
                    return;
                }

                const data = JSON.parse(storedData);
                setTreeData(data);
                setError(null);
            } catch (err) {
                setError(`Ошибка загрузки данных дерева: ${err.message}`);
                console.error('Ошибка загрузки данных дерева:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadData();
    }, []);

    const handleReset = () => {
        localStorage.removeItem('treeData');
        navigate('/', { replace: true });
    };

    const handleViewInGrid = () => {
        navigate('/grid');
    };

    if (isLoading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <LoadingIndicator message="Загрузка данных дерева..." />
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-lg p-8">
                    <ErrorMessage
                        message={error}
                        onReset={handleReset}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen overflow-hidden bg-gray-50">
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
                <h1 className="text-xl font-semibold text-gray-800" onClick={() => navigate('/')}>Визуализация дерева игры</h1>
                <div className="flex items-center gap-4">
                    <button
                        onClick={handleViewInGrid}
                        className="px-4 py-2 text-sm text-white bg-green-600 border border-green-700 rounded hover:bg-green-700"
                    >
                        Просмотр в табличном виде
                    </button>
                    <button
                        onClick={handleReset}
                        className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
                    >
                        Загрузить новый файл
                    </button>
                </div>
            </div>
            
            <div className="h-[calc(100vh-4rem)]">
                <TreeView 
                    data={treeData} 
                    onError={(err) => setError(err.message)}
                />
            </div>
        </div>
    );
};

export default TreePage;