// src/pages/TreeGrowthPage.js (обновленный)
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TreeView from '../components/tree/TreeView';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { ErrorMessage } from '../components/common/ErrorMessage';
import StatusMessage from '../components/common/StatusMessage';
import Button from '../components/common/Button';
import { sessionApi } from '../services/api';

const TreeGrowthPage = () => {
    const { sessionId, turnNumber } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [growthSteps, setGrowthSteps] = useState([]);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    
    const playbackTimerRef = useRef(null);
    
    // Fetch tree growth data
    useEffect(() => {
        const fetchTreeGrowth = async () => {
            if (!sessionId || !turnNumber) {
                setError("Session ID and turn number are required");
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                setError(null);
                
                // Получаем данные роста дерева для указанного хода
                const data = await sessionApi.getTurnGrowth(sessionId, parseInt(turnNumber));
                
                if (!data || !Array.isArray(data) || data.length === 0) {
                    throw new Error('No growth data available for this turn');
                }
                
                // Ensure statistics are properly formatted for visualization
                const processedData = data.map(step => {
                    // Process tree to ensure all nodes have statistics
                    ensureNodeStatistics(step.tree);
                    return step;
                });
                
                setGrowthSteps(processedData);
                setCurrentStepIndex(0);
            } catch (err) {
                console.error('Error fetching tree growth:', err);
                setError(err.message || 'Failed to load tree growth data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchTreeGrowth();
        
        // Cleanup playback timer on unmount
        return () => {
            if (playbackTimerRef.current) {
                clearInterval(playbackTimerRef.current);
            }
        };
    }, [sessionId, turnNumber]);
    
    // Recursive function to ensure all nodes have statistics
    // Удостоверимся, что у каждого узла есть необходимые поля статистики
const ensureNodeStatistics = (node) => {
    if (!node) return;
    
    // Ensure node has statistics object
    if (!node.statistics) {
        node.statistics = { numVisits: 0, relativeVisits: 0, statisticsForActions: [] };
    } else if (typeof node.statistics.numVisits !== 'number') {
        node.statistics.numVisits = 0;
    }
    
    // Ensure relative visits property exists
    if (typeof node.statistics.relativeVisits !== 'number') {
        node.statistics.relativeVisits = 0;
    }
    
    // Ensure statisticsForActions is an array
    if (!Array.isArray(node.statistics.statisticsForActions)) {
        node.statistics.statisticsForActions = [];
    }
    
    // Process children recursively
    if (node.children && Array.isArray(node.children)) {
        node.children.forEach(ensureNodeStatistics);
    }
};
    
    // Handle playback
    useEffect(() => {
        // Clear existing timer
        if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
        }
        
        // Set up new timer if playing
        if (isPlaying) {
            playbackTimerRef.current = setInterval(() => {
                setCurrentStepIndex(prevIndex => {
                    // Stop playback at the end
                    if (prevIndex >= growthSteps.length - 1) {
                        setIsPlaying(false);
                        return prevIndex;
                    }
                    return prevIndex + 1;
                });
            }, 1000 / playbackSpeed);
        }
        
        // Cleanup on unmount
        return () => {
            if (playbackTimerRef.current) {
                clearInterval(playbackTimerRef.current);
            }
        };
    }, [isPlaying, playbackSpeed, growthSteps.length]);
    
    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };
    
    const handleStepChange = (step) => {
        // Ensure step is within bounds
        const newStep = Math.max(0, Math.min(step, growthSteps.length - 1));
        setCurrentStepIndex(newStep);
    };
    
    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
    };
    
    const handleReset = () => {
        setIsPlaying(false);
        setCurrentStepIndex(0);
    };
    
    const handleBackToTurns = () => {
        navigate(`/turns/${sessionId}`);
    };
    
    const handleBackToGames = () => {
        navigate('/');
    };
    
    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <LoadingIndicator message="Loading tree growth data..." />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-lg p-8">
                    <ErrorMessage 
                        message={error}
                        onReset={handleBackToTurns}
                    />
                </div>
            </div>
        );
    }
    
    const currentStep = growthSteps[currentStepIndex];
    
    return (
        <div className="h-screen overflow-hidden bg-gray-50">
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-800 mr-4">
                        Tree Growth Player
                    </h1>
                    <StatusMessage 
                        type="info" 
                        message={`Session: ${sessionId} | Turn: ${turnNumber}`}
                        className="bg-blue-50 text-xs py-1 px-2"
                    />
                </div>
                
                <div className="flex space-x-2">
                    <Button
                        onClick={handleBackToTurns}
                        variant="secondary"
                    >
                        Back to Turns
                    </Button>
                    
                    <Button
                        onClick={handleBackToGames}
                        variant="secondary"
                    >
                        Back to Sessions
                    </Button>
                </div>
            </div>
            
            <div className="h-[calc(100vh-4rem)]">
                <div className="h-full flex flex-col">
                    {/* Playback controls */}
                    <div className="bg-white border-b flex items-center justify-between p-4">
                        <div className="flex items-center space-x-4">
                            <Button
                                onClick={handlePlayPause}
                                variant="primary"
                            >
                                {isPlaying ? 'Pause' : 'Play'}
                            </Button>
                            
                            <Button
                                onClick={handleReset}
                                variant="secondary"
                            >
                                Reset
                            </Button>
                            
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Speed:</span>
                                <select
                                    value={playbackSpeed}
                                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                >
                                    <option value={0.5}>0.5x</option>
                                    <option value={1}>1x</option>
                                    <option value={2}>2x</option>
                                    <option value={5}>5x</option>
                                </select>
                            </div>
                        </div>
                        
                        <div className="flex items-center space-x-4">
                            <div className="text-sm text-gray-600">
                                Step {currentStepIndex + 1} of {growthSteps.length}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={() => handleStepChange(currentStepIndex - 1)}
                                    disabled={currentStepIndex === 0}
                                    variant="secondary"
                                    className="px-3 py-1"
                                >
                                    &lt;
                                </Button>
                                
                                <input
                                    type="range"
                                    min={0}
                                    max={growthSteps.length - 1}
                                    value={currentStepIndex}
                                    onChange={(e) => handleStepChange(parseInt(e.target.value))}
                                    className="w-40"
                                />
                                
                                <Button
                                    onClick={() => handleStepChange(currentStepIndex + 1)}
                                    disabled={currentStepIndex === growthSteps.length - 1}
                                    variant="secondary"
                                    className="px-3 py-1"
                                >
                                    &gt;
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Step information */}
                    <div className="bg-gray-100 px-4 py-2 text-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium">Turn:</span> {currentStep.turn}
                                {' | '}
                                <span className="font-medium">Step:</span> {currentStep.stepNumber}
                                {' | '}
                                <span className="font-medium">
                                    {currentStep.patchNumber === -1 ? 'Final State' : `Growth #${currentStep.patchNumber}`}
                                </span>
                                {' | '}
                                <span className="font-medium">Visits:</span> {currentStep.tree?.statistics?.numVisits || 0}
                            </div>
                            <div>
                                <span className="font-medium">Total Nodes:</span> {calculateNodeCount(currentStep.tree)}
                            </div>
                        </div>
                    </div>
                    
                    {/* Tree visualization */}
                    <div className="flex-1 overflow-hidden">
                        <TreeView 
                            data={currentStep.tree}
                            onError={(err) => setError(err.message)}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

// Helper function to calculate the total number of nodes in a tree
const calculateNodeCount = (tree) => {
    if (!tree) return 0;
    
    let count = 1; // Count the node itself
    
    if (tree.children && Array.isArray(tree.children)) {
        // Add count of all children recursively
        count += tree.children.reduce((sum, child) => sum + calculateNodeCount(child), 0);
    }
    
    return count;
};

export default TreeGrowthPage;