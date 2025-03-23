// src/pages/SessionInputPage.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ErrorMessage } from '../components/common/ErrorMessage';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SessionInputPage = () => {
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState('');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!sessionId.trim()) {
            setError('Please enter a session ID');
            return;
        }
        
        setError(null);
        setIsLoading(true);
        
        try {
            // Send the session ID in the request body
            const response = await fetch('http://localhost:5002/api/GameSession/exists', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ sessionId }),
            });
            
            if (!response.ok) {
                throw new Error('Failed to check session');
            }
            
            const exists = await response.json();
            
            if (!exists) {
                setError(`Session "${sessionId}" not found`);
                return;
            }
            
            // Navigate to the tree growth player
            navigate(`/turns/${sessionId}`);
        } catch (err) {
            setError(`Error: ${err.message}`);
            console.error('Error checking session:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md p-8">
                <h1 className="text-2xl font-bold text-center mb-6">
                    Enter Game Session ID
                </h1>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="sessionId" className="block text-sm font-medium text-gray-700 mb-1">
                            Session ID
                        </label>
                        <input
                            id="sessionId"
                            type="text"
                            placeholder="e.g., MyTur.ticTacToe1x3.1741612206744"
                            value={sessionId}
                            onChange={(e) => setSessionId(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isLoading}
                        />
                    </div>
                    
                    {error && (
                        <ErrorMessage 
                            message={error}
                            onReset={() => setError(null)}
                        />
                    )}
                    
                    <Button
                        type="submit"
                        variant="primary"
                        className="w-full"
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <div className="flex items-center justify-center">
                                <LoadingSpinner size="sm" />
                                <span className="ml-2">Checking...</span>
                            </div>
                        ) : (
                            'View Tree Growth'
                        )}
                    </Button>
                </form>
            </Card>
        </div>
    );
};

export default SessionInputPage;