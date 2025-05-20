import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TreeUpload from '../components/tree/TreeUpload';
import { ErrorMessage } from '../components/common/ErrorMessage';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { validateTreeData } from '../utils/validation';

// API URL должен быть в конфигурации, здесь для примера
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost/api';

const UploadPage = () => {
    const navigate = useNavigate();
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleUpload = async (data) => {
        setError(null);
        setIsLoading(true);

        try {
            // Базовая проверка формата JSON (без проверки структуры)
            const validation = validateTreeData(data);
            if (!validation.isValid) {
                setError(validation.errors.join('\n'));
                setIsLoading(false);
                return;
            }

            // Отправка данных на backend
            const response = await fetch(`${API_URL}TreeData/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(validation.data),
            });

            // Обработка ответа
            if (!response.ok) {
                // Попытка получить сообщение об ошибке
                let errorMessage = await response.text();
                try {
                    // Проверяем, является ли ответ JSON с сообщением об ошибке
                    const errorJson = JSON.parse(errorMessage);
                    errorMessage = errorJson.message || errorJson.error || errorMessage;
                } catch (e) {
                    // Если не JSON, оставляем как текст
                }

                setError(`Ошибка сервера: ${errorMessage}`);
                setIsLoading(false);
                return;
            }

            // Получаем обработанные данные
            const processedData = await response.json();

            // Сохраняем обработанные данные в localStorage
            localStorage.setItem('treeData', JSON.stringify(processedData));

            // Перенаправляем на страницу визуализации
            navigate('/tree');
        } catch (error) {
            setError('Ошибка обработки файла: ' + (error.message || 'Неизвестная ошибка'));
            console.error('Ошибка загрузки:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingIndicator message="Обработка файла..." />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto py-12 px-4">
                {/* Заголовок */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4" onClick={() => navigate('/')}>
                        Визуализация дерева игры
                    </h1>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                        Загрузите JSON-файл игрового дерева для визуализации и анализа данных.
                        Визуализация поможет вам понять структуру дерева и статистику узлов.
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
                    <h2 className="text-2xl font-semibold text-gray-900 mb-6">Требования к файлу</h2>
                    <div className="bg-white rounded-lg shadow p-6 space-y-4">
                        <div className="space-y-2">
                            <p className="text-gray-600">
                                Загрузите файл в формате JSON, содержащий структуру дерева. Данные будут проверены и обработаны сервером.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UploadPage;