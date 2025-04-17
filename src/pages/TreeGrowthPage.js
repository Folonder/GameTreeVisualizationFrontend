// src/pages/TreeGrowthPage.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TreeView from '../components/tree/TreeView';
import TreeTransition from '../components/tree/TreeTransition';
import LoadingIndicator from '../components/common/LoadingIndicator';
import { ErrorMessage } from '../components/common/ErrorMessage';
import StatusMessage from '../components/common/StatusMessage';
import Button from '../components/common/Button';
import { sessionApi } from '../services/api';
import { createNodeMap, calculateChanges } from '../utils/treeVisibilityUtils';
import { ensureNodeStatistics, calculateNodeCount } from '../utils/treeUtils';

const TreeGrowthPage = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Данные всех ходов и шагов
    const [allTurns, setAllTurns] = useState([]);
    const [availableTurns, setAvailableTurns] = useState([]);
    
    // Вычисляем общее количество шагов для всех ходов
    const [flattenedSteps, setFlattenedSteps] = useState([]);
    const [currentFlatIndex, setCurrentFlatIndex] = useState(0);
    
    // Состояние управления воспроизведением
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [changes, setChanges] = useState(null);
    
    const playbackTimerRef = useRef(null);
    
    // Загружаем данные всех ходов и их шагов
    useEffect(() => {
        const fetchAllTreeGrowth = async () => {
            if (!sessionId) {
                setError("Session ID is required");
                setLoading(false);
                return;
            }
            
            try {
                setLoading(true);
                setError(null);
                
                // Получаем все доступные ходы
                const turns = await sessionApi.getAvailableTurns(sessionId);
                
                if (!turns || turns.length === 0) {
                    throw new Error('No turns available for this session');
                }
                
                setAvailableTurns(turns);
                
                // Загружаем данные для каждого хода
                const allTurnsData = [];
                
                for (const turnNumber of turns) {
                    const turnGrowth = await sessionApi.getTurnGrowth(sessionId, turnNumber);
                    
                    if (turnGrowth && turnGrowth.length > 0) {
                        // Обрабатываем данные дерева
                        const processedSteps = turnGrowth.map(step => {
                            ensureNodeStatistics(step.tree);
                            return step;
                        });
                        
                        allTurnsData.push({
                            turnNumber,
                            steps: processedSteps
                        });
                    }
                }
                
                setAllTurns(allTurnsData);
            } catch (err) {
                console.error('Error fetching tree growth:', err);
                setError(err.message || 'Failed to load tree growth data');
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllTreeGrowth();
        
        // Очистка таймера при размонтировании
        return () => {
            if (playbackTimerRef.current) {
                clearInterval(playbackTimerRef.current);
            }
        };
    }, [sessionId]);
    
    // После загрузки всех данных формируем плоский список всех шагов
    useEffect(() => {
        if (!allTurns || allTurns.length === 0) return;
        
        const steps = [];
        const turnMilestones = [];
        
        allTurns.forEach((turn, turnIndex) => {
            turnMilestones.push({
                index: steps.length,
                turnNumber: turn.turnNumber
            });
            
            turn.steps.forEach((step) => {
                steps.push({
                    turnIndex,
                    turnNumber: turn.turnNumber,
                    stepIndex: step.stepNumber,
                    patchNumber: step.patchNumber,
                    tree: step.tree,
                    isFirstOfTurn: step.stepNumber === 0,
                    isLastOfTurn: step.stepNumber === turn.steps.length - 1
                });
            });
        });
        
        // Добавляем последнюю метку на конец списка
        turnMilestones.push({
            index: steps.length,
            turnNumber: null // Конец последнего хода
        });
        
        setFlattenedSteps(steps);
        // Устанавливаем начальный индекс на 0
        setCurrentFlatIndex(0);
    }, [allTurns]);
    
    // Получение текущего шага
    const currentStep = useMemo(() => {
        if (!flattenedSteps || flattenedSteps.length === 0 || currentFlatIndex < 0 || currentFlatIndex >= flattenedSteps.length) {
            return null;
        }
        return flattenedSteps[currentFlatIndex];
    }, [flattenedSteps, currentFlatIndex]);
    
    // Получение индексов для родительских массивов
    const { currentTurnIndex, currentStepIndexInTurn } = useMemo(() => {
        if (!currentStep) return { currentTurnIndex: 0, currentStepIndexInTurn: 0 };
        return {
            currentTurnIndex: currentStep.turnIndex,
            currentStepIndexInTurn: currentStep.stepIndex
        };
    }, [currentStep]);
    
    // Получение общего количества шагов
    const totalFlatSteps = useMemo(() => {
        return flattenedSteps.length;
    }, [flattenedSteps]);
    
    // Получение меток ходов на временной шкале
    const turnMarkers = useMemo(() => {
        if (!flattenedSteps || flattenedSteps.length === 0) return [];
        
        const markers = [];
        let currentTurn = null;
        
        flattenedSteps.forEach((step, index) => {
            if (currentTurn !== step.turnNumber) {
                currentTurn = step.turnNumber;
                markers.push({
                    index,
                    turnNumber: step.turnNumber
                });
            }
        });
        
        return markers;
    }, [flattenedSteps]);
    
    // Обновляем изменения при смене шага
    useEffect(() => {
        if (!flattenedSteps || flattenedSteps.length === 0 || currentFlatIndex <= 0) {
            setChanges(null);
            return;
        }
        
        const currentStep = flattenedSteps[currentFlatIndex];
        const previousStep = flattenedSteps[currentFlatIndex - 1];
        
        if (!previousStep || !previousStep.tree) {
            setChanges(null);
            return;
        }
        
        // Вычисляем изменения между текущим и предыдущим шагом
        const previousStepMap = createNodeMap(previousStep.tree);
        const currentChanges = calculateChanges(currentStep.tree, previousStepMap);
        
        setChanges(currentChanges);
    }, [currentFlatIndex, flattenedSteps]);
    
    // Управление воспроизведением
    useEffect(() => {
        if (playbackTimerRef.current) {
            clearInterval(playbackTimerRef.current);
            playbackTimerRef.current = null;
        }
        
        if (isPlaying && !isTransitioning) {
            playbackTimerRef.current = setInterval(() => {
                setCurrentFlatIndex(prevIndex => {
                    if (prevIndex >= totalFlatSteps - 1) {
                        // Достигли конца всех ходов
                        setIsPlaying(false);
                        return prevIndex;
                    }
                    
                    const currentStep = flattenedSteps[prevIndex];
                    
                    if (currentStep && currentStep.isLastOfTurn && prevIndex < totalFlatSteps - 1) {
                        // Достигли конца текущего хода, но есть еще ходы
                        // Запускаем анимацию перехода
                        setIsTransitioning(true);
                        // Возвращаем текущий индекс без изменений
                        return prevIndex;
                    }
                    
                    // Обычное воспроизведение - переходим к следующему шагу
                    return prevIndex + 1;
                });
            }, 1000 / playbackSpeed);
        }
        
        return () => {
            if (playbackTimerRef.current) {
                clearInterval(playbackTimerRef.current);
            }
        };
    }, [isPlaying, playbackSpeed, totalFlatSteps, flattenedSteps, isTransitioning]);
    
    // Обработчик завершения перехода между ходами
    const handleTransitionComplete = () => {
        setIsTransitioning(false);
        
        // Переходим к первому шагу следующего хода
        if (currentFlatIndex < totalFlatSteps - 1) {
            // Ищем первый шаг следующего хода
            const currentTurn = flattenedSteps[currentFlatIndex].turnNumber;
            let nextStepIndex = currentFlatIndex + 1;
            
            while (nextStepIndex < totalFlatSteps && 
                  flattenedSteps[nextStepIndex].turnNumber === currentTurn) {
                nextStepIndex++;
            }
            
            if (nextStepIndex < totalFlatSteps) {
                setCurrentFlatIndex(nextStepIndex);
                
                // Продолжаем воспроизведение, если оно было активно
                if (isPlaying) {
                    // Небольшая пауза перед продолжением воспроизведения
                    setTimeout(() => {
                        if (isPlaying) { // Проверяем, все еще активно ли воспроизведение
                            // Здесь можно добавить дополнительные действия при переходе
                        }
                    }, 500);
                }
            } else {
                // Если не нашли следующий ход, это был последний
                setIsPlaying(false);
            }
        }
    };
    
    // Обработчики управления
    const handlePlayPause = () => {
        setIsPlaying(!isPlaying);
    };
    
    const handleStepForward = () => {
        if (currentFlatIndex >= totalFlatSteps - 1) return;
        
        const currentStep = flattenedSteps[currentFlatIndex];
        
        if (currentStep.isLastOfTurn) {
            // Запускаем анимацию перехода к следующему ходу
            setIsTransitioning(true);
        } else {
            // Просто переходим к следующему шагу
            setCurrentFlatIndex(prev => prev + 1);
        }
    };
    
    const handleStepBackward = () => {
        if (currentFlatIndex <= 0) return;
        setCurrentFlatIndex(prev => prev - 1);
    };
    
    // Функция для обработки перетаскивания ползунка
    const handleFlatIndexChange = (newIndex) => {
        // Если анимация перехода активна, игнорируем изменения ползунка
        if (isTransitioning) return;
        
        if (newIndex < 0 || newIndex >= totalFlatSteps) return;
        
        const targetStep = flattenedSteps[newIndex];
        const currentTurn = currentStep ? currentStep.turnNumber : null;
        
        // Проверяем, есть ли переход между ходами
        // Если движемся вперед и переходим между ходами, запускаем анимацию
        if (targetStep && currentStep && 
            targetStep.turnNumber !== currentStep.turnNumber && 
            targetStep.turnNumber > currentStep.turnNumber) {
            
            // Находим последний шаг текущего хода
            const lastStepOfCurrentTurn = flattenedSteps.find(step => 
                step.turnNumber === currentStep.turnNumber && step.isLastOfTurn
            );
            
            if (lastStepOfCurrentTurn) {
                // Сначала переходим к последнему шагу текущего хода
                setCurrentFlatIndex(flattenedSteps.indexOf(lastStepOfCurrentTurn));
                // Затем запускаем анимацию перехода
                setIsTransitioning(true);
                return;
            }
        }
        
        // Если движемся назад через ходы, просто переключаемся без анимации
        setCurrentFlatIndex(newIndex);
    };
    
    const handleSpeedChange = (speed) => {
        setPlaybackSpeed(speed);
    };
    
    const handleReset = () => {
        setIsPlaying(false);
        setCurrentFlatIndex(0);
    };
    
    const handleBackToGames = () => {
        navigate('/');
    };
    
    const handleViewInGrid = () => {
        if (currentStep && currentStep.tree) {
            localStorage.setItem('treeData', JSON.stringify(currentStep.tree));
            window.open('/grid', '_blank');
        }
    };
    
    // Получение данных для анимации перехода
    const getTransitionData = () => {
        if (!currentStep || !currentStep.isLastOfTurn || currentFlatIndex >= totalFlatSteps - 1) {
            return { previousTree: null, nextTree: null, currentTurn: null, nextTurn: null };
        }
        
        const currentTurnNumber = currentStep.turnNumber;
        let nextStepIndex = currentFlatIndex + 1;
        
        // Ищем первый шаг следующего хода
        while (nextStepIndex < totalFlatSteps && 
              flattenedSteps[nextStepIndex].turnNumber === currentTurnNumber) {
            nextStepIndex++;
        }
        
        if (nextStepIndex < totalFlatSteps) {
            return {
                previousTree: currentStep.tree,
                nextTree: flattenedSteps[nextStepIndex].tree,
                currentTurn: currentTurnNumber,
                nextTurn: flattenedSteps[nextStepIndex].turnNumber
            };
        }
        
        return { previousTree: null, nextTree: null, currentTurn: null, nextTurn: null };
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
                        onReset={handleBackToGames}
                    />
                </div>
            </div>
        );
    }
    
    if (!currentStep) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="w-full max-w-lg p-8">
                    <ErrorMessage 
                        message="No tree data available"
                        onReset={handleBackToGames}
                    />
                </div>
            </div>
        );
    }
    
    const transitionData = getTransitionData();
    
    // Рассчитываем общий прогресс
    const overallProgress = (currentFlatIndex / (totalFlatSteps - 1)) * 100;
    
    return (
        <div className="h-screen overflow-hidden bg-gray-50">
            <div className="h-16 bg-white border-b border-gray-200 flex items-center px-4 justify-between">
                <div className="flex items-center">
                    <h1 className="text-xl font-semibold text-gray-800 mr-4" onClick={() => navigate('/')}>
                        Game Tree Visualization
                    </h1>
                    <StatusMessage 
                        type="info" 
                        message={`Session: ${sessionId}`}
                        className="bg-blue-50 text-xs py-1 px-2"
                    />
                </div>
                
                <div className="flex space-x-2">
                    <Button
                        onClick={handleViewInGrid}
                        variant="primary"
                        className="bg-green-600 hover:bg-green-700"
                    >
                        View in Grid
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
                                disabled={isTransitioning}
                            >
                                {isPlaying ? 'Pause' : 'Play'}
                            </Button>
                            
                            <Button
                                onClick={handleReset}
                                variant="secondary"
                                disabled={isTransitioning}
                            >
                                Reset
                            </Button>
                            
                            <div className="flex items-center space-x-2">
                                <span className="text-sm text-gray-600">Speed:</span>
                                <select
                                    value={playbackSpeed}
                                    onChange={(e) => handleSpeedChange(Number(e.target.value))}
                                    className="border border-gray-300 rounded px-2 py-1 text-sm"
                                    disabled={isTransitioning}
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
                                Turn {currentStep.turnNumber}: Step {currentStep.stepIndex + 1}
                            </div>
                            
                            <div className="flex items-center space-x-2">
                                <Button
                                    onClick={handleStepBackward}
                                    disabled={currentFlatIndex === 0 || isTransitioning}
                                    variant="secondary"
                                    className="px-3 py-1"
                                >
                                    &lt;
                                </Button>
                                
                                <Button
                                    onClick={handleStepForward}
                                    disabled={currentFlatIndex >= totalFlatSteps - 1 || isTransitioning}
                                    variant="secondary"
                                    className="px-3 py-1"
                                >
                                    &gt;
                                </Button>
                            </div>
                        </div>
                    </div>
                    
                    {/* Объединенная полоса прокрутки для всех итераций */}
                    <div className="bg-white border-b px-4 pb-4">
                        <div className="w-full relative pt-8"> {/* Увеличенный отступ сверху для меток */}
                            <div className="relative">
                                {/* Сначала метки итераций */}
                                <div className="absolute -top-8 left-0 right-0 h-6 z-10">
                                    {turnMarkers.map((marker, index) => {
                                        const position = (marker.index / (totalFlatSteps - 1)) * 100;
                                        return (
                                            <div 
                                                key={index} 
                                                className="absolute top-0 flex flex-col items-center"
                                                style={{ left: `${position}%` }}
                                            >
                                                <div className="h-4 w-1 bg-blue-500"></div>
                                                <span className="text-xs text-blue-600">Turn {marker.turnNumber}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                                
                                {/* Затем кликабельный ползунок */}
                                <div 
                                    className="relative w-full h-8 bg-gray-200 rounded-lg cursor-pointer mb-2 mt-2"
                                    onClick={(e) => {
                                        if (isTransitioning) return;
                                        // Вычисляем позицию клика относительно слайдера
                                        const rect = e.currentTarget.getBoundingClientRect();
                                        const x = e.clientX - rect.left;
                                        const percentage = x / rect.width;
                                        // Вычисляем новый индекс
                                        const newIndex = Math.round(percentage * (totalFlatSteps - 1));
                                        // Устанавливаем новый индекс
                                        handleFlatIndexChange(newIndex);
                                    }}
                                >
                                    {/* Дополнительно добавляем метки ходов непосредственно на ползунке */}
                                    {turnMarkers.map((marker, index) => {
                                        if (index === 0) return null; // Пропускаем первую метку (начало)
                                        const position = (marker.index / (totalFlatSteps - 1)) * 100;
                                        return (
                                            <div 
                                                key={`slider-${index}`} 
                                                className="absolute top-0 h-full w-1 bg-white z-10"
                                                style={{ left: `${position}%` }}
                                            />
                                        );
                                    })}
                                    
                                    {/* Индикатор прогресса */}
                                    <div 
                                        className="absolute top-0 left-0 h-full bg-blue-500 rounded-l-lg"
                                        style={{ width: `${overallProgress}%` }}
                                    ></div>
                                    
                                    {/* Маркер текущей позиции */}
                                    <div 
                                        className="absolute top-0 h-8 w-4 bg-blue-600 rounded-full shadow border-2 border-white z-20"
                                        style={{ 
                                            left: `calc(${overallProgress}% - 2px)`,
                                            display: isTransitioning ? 'none' : 'block'
                                        }}
                                    ></div>
                                    
                                    {/* Скрытый нативный ползунок для доступности */}
                                    <input
                                        type="range"
                                        min={0}
                                        max={totalFlatSteps - 1}
                                        value={currentFlatIndex}
                                        onChange={(e) => handleFlatIndexChange(parseInt(e.target.value))}
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full"
                                        disabled={isTransitioning}
                                    />
                                </div>
                                
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-gray-500">Start</span>
                                    <span className="text-xs text-gray-500">Overall Progress: {Math.round(overallProgress)}%</span>
                                    <span className="text-xs text-gray-500">End</span>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Информация о текущем шаге */}
                    <div className="bg-gray-100 px-4 py-2 text-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium">Turn:</span> {currentStep.turnNumber}
                                {' | '}
                                <span className="font-medium">Step:</span> {currentStep.stepIndex}
                                {' | '}
                                <span className="font-medium">
                                    {currentStep.patchNumber === 'final' ? 'Final State' : `Growth #${currentStep.patchNumber}`}
                                </span>
                                {' | '}
                                <span className="font-medium">Visits:</span> {currentStep.tree?.statistics?.numVisits || 0}
                                
                                {changes && (
                                    <>
                                        {' | '}
                                        <span className="font-medium text-green-600">
                                            New nodes: {changes.newNodes.length}
                                        </span>
                                        {' | '}
                                        <span className="font-medium text-blue-600">
                                            Updated nodes: {changes.updatedNodes.length}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div>
                                <span className="font-medium">Total Nodes:</span> {calculateNodeCount(currentStep.tree)}
                                {' | '}
                                <span className="font-medium">Step:</span> {currentFlatIndex + 1} of {totalFlatSteps}
                            </div>
                        </div>
                    </div>
                    
                    {/* Tree visualization */}
                    <div className="flex-1 overflow-hidden relative">
                        <TreeView 
                            data={currentStep.tree}
                            onError={(err) => setError(err.message)}
                            changes={changes}
                            highlightChanges={true}
                        />
                        
                        {isTransitioning && (
                            <TreeTransition
                                previousTree={transitionData.previousTree}
                                nextTree={transitionData.nextTree}
                                currentTurn={transitionData.currentTurn}
                                nextTurn={transitionData.nextTurn}
                                onTransitionComplete={handleTransitionComplete}
                            />
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TreeGrowthPage;