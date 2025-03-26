// src/pages/TurnSelectionPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatusMessage from '../components/common/StatusMessage';
import { sessionApi } from '../services/api';

const TurnSelectionPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    
    const [turns, setTurns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTurn, setSelectedTurn] = useState(null);

    useEffect(() => {
        const fetchTurns = async () => {
            if (!sessionId) return;
            
            try {
                setLoading(true);
                setError(null);
                
                // Сначала проверяем, существует ли сессия
                const sessionExists = await sessionApi.checkSession(sessionId);
                if (!sessionExists) {
                    setError(`Session "${sessionId}" not found`);
                    setLoading(false);
                    return;
                }
                
                // Получаем доступные ходы
                const availableTurns = await sessionApi.getAvailableTurns(sessionId);
                setTurns(availableTurns);
                
                // Выбираем первый ход по умолчанию, если доступны ходы
                if (availableTurns && availableTurns.length > 0) {
                    setSelectedTurn(availableTurns[0]);
                }
            } catch (err) {
                console.error('Error fetching turns:', err);
                setError(err.message || 'Failed to load turns');
            } finally {
                setLoading(false);
            }
        };
        
        fetchTurns();
    }, [sessionId]);

    const handleTurnChange = (e) => {
        setSelectedTurn(parseInt(e.target.value));
    };

    const handleViewGrowth = () => {
        if (selectedTurn !== null) {
            navigate(`/tree-growth/${sessionId}/${selectedTurn}`);
        }
    };

    const handleBack = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingSpinner />
                <div className="ml-4">Loading available turns...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <h1 className="text-2xl font-bold text-center mb-6" onClick={() => navigate('/')}>
                Game Tree Visualization
                </h1>
                
                <StatusMessage 
                    type="info" 
                    message={`Session: ${sessionId}`}
                    className="mb-6"
                />

                {error ? (
                    <ErrorMessage 
                        message={error}
                        onReset={handleBack}
                    />
                ) : turns.length === 0 ? (
                    <div className="mb-6 text-center">
                        <StatusMessage 
                            type="warning" 
                            message="No turns available for this session"
                        />
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="turnSelect" className="block text-sm font-medium text-gray-700 mb-1">
                                Select Turn Number
                            </label>
                            <select
                                id="turnSelect"
                                value={selectedTurn}
                                onChange={handleTurnChange}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                {turns.map(turn => (
                                    <option key={turn} value={turn}>
                                        Turn {turn}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex space-x-4">
                            <Button
                                onClick={handleBack}
                                variant="secondary"
                                className="flex-1"
                            >
                                Back
                            </Button>
                            
                            <Button
                                onClick={handleViewGrowth}
                                variant="primary"
                                className="flex-1"
                                disabled={selectedTurn === null}
                            >
                                View Tree Growth
                            </Button>
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TurnSelectionPage;