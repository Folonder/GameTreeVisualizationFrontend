// src/pages/HomePage.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../components/common/Card';
import Button from '../components/common/Button';

const HomePage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-lg p-8">
                <h1 className="text-3xl font-bold text-center mb-8">
                    Game Tree Visualization
                </h1>
                
                <p className="text-gray-600 text-center mb-10">
                    Visualize and analyze Monte Carlo Tree Search algorithms
                </p>
                
                <div className="space-y-6">
                    <div className="p-6 bg-blue-50 rounded-lg border border-blue-100">
                        <h2 className="text-xl font-semibold text-blue-800 mb-4">
                            View Game Session
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Enter a game session ID to visualize MCTS tree growth over time. 
                            You can view each turn's growth steps and analyze the decision making process.
                        </p>
                        <Button
                            onClick={() => navigate('/sessions')}
                            variant="primary"
                            className="w-full"
                        >
                            Enter Session ID
                        </Button>
                    </div>
                    
                    <div className="p-6 bg-green-50 rounded-lg border border-green-100">
                        <h2 className="text-xl font-semibold text-green-800 mb-4">
                            Upload Tree File
                        </h2>
                        <p className="text-gray-600 mb-6">
                            Upload a JSON file containing a game tree structure to visualize and explore it.
                            You can drag nodes, filter by criteria, and analyze statistics.
                        </p>
                        <Button
                            onClick={() => navigate('/upload')}
                            variant="primary"
                            className="w-full bg-green-600 hover:bg-green-700"
                        >
                            Upload Tree File
                        </Button>
                    </div>
                </div>
                
                <div className="mt-10 text-center text-sm text-gray-500">
                    <p>
                        Select an option to start exploring tree visualizations
                    </p>
                </div>
            </Card>
        </div>
    );
};

export default HomePage;