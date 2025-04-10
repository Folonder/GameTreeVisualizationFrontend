// src/pages/IterationDetailsPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { sessionApi } from '../services/api';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { ErrorMessage } from '../components/common/ErrorMessage';
import Button from '../components/common/Button';
import StatusMessage from '../components/common/StatusMessage';
import SelectionStage from '../components/iteration/SelectionStage';
import ExpansionStage from '../components/iteration/ExpansionStage';
import PlayoutStage from '../components/iteration/PlayoutStage';
import BackpropagationStage from '../components/iteration/BackpropagationStage';

const IterationDetailsPage = () => {
    const { sessionId, turnNumber, iterationNumber } = useParams();
    const navigate = useNavigate();
    
    const [iterationDetails, setIterationDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeStage, setActiveStage] = useState('selection');
    
    useEffect(() => {
        const fetchIterationDetails = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const details = await sessionApi.getIterationDetails(
                    sessionId, 
                    parseInt(turnNumber), 
                    parseInt(iterationNumber)
                );
                
                console.log('Iteration details:', details);
                setIterationDetails(details);
            } catch (err) {
                console.error('Error fetching iteration details:', err);
                setError(err.message || 'Failed to load iteration details');
            } finally {
                setLoading(false);
            }
        };
        
        fetchIterationDetails();
    }, [sessionId, turnNumber, iterationNumber]);
    
    const handleBackToGrowth = () => {
        navigate(`/tree-growth/${sessionId}/${turnNumber}`);
    };
    
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <LoadingIndicator message="Loading iteration details..." />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-lg p-8">
                    <ErrorMessage 
                        message={error}
                        onReset={handleBackToGrowth}
                    />
                </div>
            </div>
        );
    }
    
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">
                            MCTS Iteration Details
                        </h1>
                        <StatusMessage 
                            type="info" 
                            message={`Session: ${sessionId} | Turn: ${turnNumber} | Iteration: ${iterationNumber}`}
                            className="mt-1 text-xs py-1 px-2"
                        />
                    </div>
                    
                    <Button
                        onClick={handleBackToGrowth}
                        variant="secondary"
                    >
                        Back to Tree Growth
                    </Button>
                </div>
            </header>
            
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* MCTS Diagram */}
                <div className="mb-8 p-4 bg-white shadow rounded-lg">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">Monte Carlo Tree Search Process</h2>
                    <div className="flex justify-center">
                        <div className="grid grid-cols-4 gap-4 w-full max-w-4xl">
                            {['selection', 'expansion', 'playout', 'backpropagation'].map((stage, index) => (
                                <div 
                                    key={stage}
                                    className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                                        activeStage === stage 
                                            ? 'bg-blue-50 border-blue-500 shadow-md transform -translate-y-1' 
                                            : 'bg-white border-gray-200 hover:border-blue-300'
                                    }`}
                                    onClick={() => setActiveStage(stage)}
                                >
                                    <div className="flex items-center justify-center mb-2">
                                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                                            activeStage === stage ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {index + 1}
                                        </div>
                                    </div>
                                    <div className="text-center">
                                        <h3 className={`font-medium ${activeStage === stage ? 'text-blue-700' : 'text-gray-700'}`}>
                                            {stage.charAt(0).toUpperCase() + stage.slice(1)}
                                        </h3>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Stage Content */}
                <div className="bg-white shadow rounded-lg p-6">
                    {activeStage === 'selection' && (
                        <SelectionStage data={iterationDetails?.selection} />
                    )}
                    {activeStage === 'expansion' && (
                        <ExpansionStage data={iterationDetails?.expansion} />
                    )}
                    {activeStage === 'playout' && (
                        <PlayoutStage data={iterationDetails?.playout} />
                    )}
                    {activeStage === 'backpropagation' && (
                        <BackpropagationStage data={iterationDetails?.backpropagation} />
                    )}
                </div>
            </main>
        </div>
    );
};

export default IterationDetailsPage;