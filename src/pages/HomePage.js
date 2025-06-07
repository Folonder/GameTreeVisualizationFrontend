import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-8">
                <h1 className="text-3xl font-bold text-center mb-8" onClick={() => navigate('/')}>
                    Визуализация дерева игры
                </h1>

                <p className="text-gray-600 text-center mb-10">
                    Визуализация и анализ алгоритмов поиска по дереву методом Монте-Карло
                </p>

                <div className="space-y-6">
                    <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                        <h2 className="text-xl font-semibold text-blue-800 mb-4">
                            Просмотр матча
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Введите ID матча для визуализации роста дерева MCTS.
                            Вы сможете просмотреть шаги роста дерева и анализировать процесс принятия решений.
                        </p>
                        <Button
                            onClick={() => navigate('/sessions')}
                            variant="primary"
                            className="w-full"
                        >
                            Выбрать матч
                        </Button>
                    </div>

                    <div className="p-6 bg-green-50 rounded-lg border border-green-100">
                        <h2 className="text-xl font-semibold text-green-800 mb-4">
                            Загрузить файл дерева
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Загрузите JSON-файл, содержащий структуру игрового дерева для визуализации и исследования.
                            Вы сможете перемещать узлы, фильтровать по критериям и анализировать статистику.
                        </p>
                        <Button
                            onClick={() => navigate('/upload')}
                            variant="primary"
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            Загрузить файл дерева
                        </Button>
                    </div>
                </div>

                <div className="mt-10 text-center text-sm text-gray-500">
                    <p>
                        Выберите вариант для начала исследования визуализации дерева
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default HomePage;