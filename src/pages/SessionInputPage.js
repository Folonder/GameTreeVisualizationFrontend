import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { sessionApi } from '../services/api';

const SessionInputPage = () => {
    const navigate = useNavigate();
    const [sessions, setSessions] = useState([]);
    const [filteredSessions, setFilteredSessions] = useState([]);
    const [selectedSession, setSelectedSession] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                setIsLoading(true);
                setError(null);
                
                const availableSessions = await sessionApi.getAllSessions();
                
                if (availableSessions && availableSessions.length > 0) {
                    setSessions(availableSessions);
                    setFilteredSessions(availableSessions);
                    setSelectedSession(availableSessions[0]); // Выбираем первый элемент по умолчанию
                } else {
                    setError('Не найдено доступных игровых сессий');
                }
            } catch (err) {
                console.error('Ошибка загрузки сессий:', err);
                setError(err.message || 'Не удалось загрузить доступные сессии');
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchSessions();
    }, []);

    // Фильтрация сессий при изменении поискового запроса
    useEffect(() => {
        if (!searchTerm.trim()) {
            setFilteredSessions(sessions);
            return;
        }
        
        const filtered = sessions.filter(session => 
            session.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredSessions(filtered);
        
        // Если есть результаты фильтрации, выбираем первый
        if (filtered.length > 0) {
            setSelectedSession(filtered[0]);
        }
    }, [searchTerm, sessions]);

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!selectedSession) {
            setError('Пожалуйста, выберите сессию');
            return;
        }
        
        navigate(`/tree-growth/${selectedSession}`);
    };
    
    // Извлечение и отображение информации о типе игры из ID сессии
    const extractGameType = (sessionId) => {
        const match = sessionId.match(/^([^_]+)/);
        return match ? match[1] : 'Неизвестная игра';
    };
    
    // Извлечение и отображение даты и времени из ID сессии
    const extractDateTime = (sessionId) => {
        const match = sessionId.match(/_(\d{8})_(\d{6})_/);
        if (!match) return '';
        
        const dateStr = match[1];
        const timeStr = match[2];
        
        const year = dateStr.slice(0, 4);
        const month = dateStr.slice(4, 6);
        const day = dateStr.slice(6, 8);
        
        const hours = timeStr.slice(0, 2);
        const minutes = timeStr.slice(2, 4);
        const seconds = timeStr.slice(4, 6);
        
        return `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-8">
                <h1 className="text-2xl font-bold text-center mb-6" onClick={() => navigate('/')}>
                    Визуализация дерева игры
                </h1>
                
                {isLoading ? (
                    <div className="flex justify-center items-center">
                        <LoadingSpinner />
                        <div className="ml-4">Загрузка доступных сессий...</div>
                    </div>
                ) : error ? (
                    <ErrorMessage 
                        message={error}
                        onReset={() => navigate('/')}
                    />
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label htmlFor="sessionSearch" className="block text-sm font-medium text-gray-700 mb-2">
                                Поиск сессии
                            </label>
                            <input
                                id="sessionSearch"
                                type="text"
                                placeholder="Введите часть ID сессии или название игры..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Доступные сессии ({filteredSessions.length})
                            </label>
                            
                            {filteredSessions.length === 0 ? (
                                <div className="text-center p-4 border border-gray-200 rounded-md bg-gray-50">
                                    Нет доступных сессий по запросу "{searchTerm}"
                                </div>
                            ) : (
                                <div className="border border-gray-200 rounded-md max-h-64 overflow-y-auto">
                                    {filteredSessions.map(session => (
                                        <div 
                                            key={session}
                                            className={`p-3 border-b last:border-b-0 cursor-pointer hover:bg-blue-50 transition-colors ${selectedSession === session ? 'bg-blue-100' : ''}`}
                                            onClick={() => setSelectedSession(session)}
                                        >
                                            <div className="flex justify-between">
                                                <div className="font-medium text-blue-700">
                                                    {extractGameType(session)}
                                                </div>
                                                <div className="text-sm text-gray-500">
                                                    {extractDateTime(session)}
                                                </div>
                                            </div>
                                            <div className="text-xs text-gray-500 mt-1 truncate">
                                                {session}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            disabled={isLoading || !selectedSession}
                        >
                            Просмотр роста дерева
                        </Button>
                        
                        <div className="text-center text-sm text-gray-500 mt-4">
                            Выберите игровую сессию из списка для визуализации роста дерева. 
                            Поиск работает по названию игры и идентификатору сессии.
                        </div>
                    </form>
                )}
            </Card>
        </div>
    );
};

export default SessionInputPage;