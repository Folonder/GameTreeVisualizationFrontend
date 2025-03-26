// src/pages/UploadPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TreeUpload from '../components/tree/TreeUpload';
import { ErrorMessage } from '../components/common/ErrorMessage';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { validateTreeData } from '../utils/validation';

const UploadPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async (data) => {
        setError(null);
        setIsLoading(true);

        try {
            // Валидация данных
            const validation = validateTreeData(data);
            if (!validation.isValid) {
                setError(validation.errors.join('\n'));
                return;
            }

            // Сохраняем данные в localStorage
            localStorage.setItem('treeData', JSON.stringify(validation.data));
            
            // Перенаправляем на страницу визуализации
            navigate('/tree');
        } catch (error) {
            setError('Failed to process the file: ' + error.message);
            console.error('Upload error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingIndicator message="Processing file..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-12 px-4">
                {/* Заголовок */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4" onClick={() => navigate('/')}>
                        Game Tree Visualization
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Upload your game tree JSON file to visualize and analyze the data.
                        The visualization will help you understand the tree structure and node statistics.
                    </p>
                </div>

                {/* Компонент загрузки */}
                <div className="max-w-2xl mx-auto">
                    <TreeUpload onUpload={handleUpload} />
                    
                    {error && (
                        <div className="mt-4">
                            <ErrorMessage 
                                message={error}
                                onReset={() => setError(null)}
                            />
                        </div>
                    )}
                </div>

                {/* Инструкции */}
                <div className="mt-16 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">File Requirements</h2>
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-gray-900">Required Structure</h3>
                            <pre className="bg-gray-50 p-4 rounded text-sm overflow-auto">
{`{
  "state": "...",
  "statistics": {
    "numVisits": number,
    "statisticsForActions": [
      {
        "role": "string",
        "actions": [
          {
            "action": "string",
            "averageActionScore": number,
            "actionNumUsed": number
          }
        ]
      }
    ]
  },
  "children": [...]
}`}
                            </pre>
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-lg font-medium text-gray-900">Important Notes</h3>
                            <ul className="list-disc list-inside space-y-1 text-gray-600">
                                <li>File must be in valid JSON format</li>
                                <li>All fields marked in the structure are required</li>
                                <li>numVisits and actionNumUsed must be positive numbers</li>
                                <li>averageActionScore can be any number</li>
                                <li>children array can be empty but must be present</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;