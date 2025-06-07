import React, { useState, useEffect, useRef } from 'react';
import { getNodeIdentifier, calculateNodePercentageFromRoot, findRootNode } from '../../utils/treeUtils';
import { calculateNodePath, formatPathForUrl } from '../../utils/gridUtils';

const Statistics = ({ data, node, onClose }) => {
    if (!data?.statistics) return null;
    const stats = data.statistics;
    
    const percentFromRoot = (calculateNodePercentageFromRoot(node)).toFixed(2);

    return (
        <div className="absolute left-full top-0 ml-2 bg-white rounded shadow-lg border p-4 min-w-[300px] z-50">
            <div className="flex justify-end mb-2">
                <button 
                    onClick={onClose} 
                    className="text-gray-500 hover:text-gray-700"
                    title="Закрыть статистику"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="space-y-3">
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Основная статистика</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-500">Посещений:</span>
                            <span className="ml-2 font-medium">{stats.numVisits}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">Относительно корня:</span>
                            <span className="ml-2 font-medium">{percentFromRoot}%</span>
                        </div>
                    </div>
                </div>

                {stats.statisticsForActions?.map((roleStat, index) => (
                    <div key={index}>
                        <h3 className="text-sm font-medium text-gray-500 mb-2">{roleStat.role}</h3>
                        <div className="space-y-1">
                            {roleStat.actions.map((action, actionIndex) => (
                                <div key={actionIndex} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-600">{action.action}:</span>
                                    <div>
                                        <span className="font-medium">
                                            {Math.round(action.averageActionScore * 100) / 100}
                                        </span>
                                        <span className="text-gray-400 ml-2">
                                            ({action.actionNumUsed})
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ContextMenu = ({ 
    x, 
    y, 
    node, 
    nodeState,
    hiddenChildrenIds,
    filteredChildrenIds,
    overrideFilterIds,
    changes,              // Добавлено
    highlightChanges,     // Добавлено
    onClose, 
    onToggleExpansion,
    onResetNodePosition 
}) => {
    const [showStats, setShowStats] = useState(false);
    const menuRef = useRef(null);
    const [menuPosition, setMenuPosition] = useState({ x, y });

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    // Position the menu to ensure it's fully visible
    useEffect(() => {
        if (!menuRef.current) return;

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        let newX = x;
        let newY = y;

        // Adjust horizontal position
        if (x + rect.width > viewportWidth) {
            newX = viewportWidth - rect.width - 10;
        }

        // Adjust vertical position
        if (y + rect.height > viewportHeight) {
            newY = y - rect.height - 10;  // Position above the click point
        }

        setMenuPosition({ x: newX, y: newY });
    }, [x, y]);

    const hasChildren = node?.children && node.children.length > 0;
    const nodeId = getNodeIdentifier(node);
    
    const isHiddenManually = hiddenChildrenIds?.has(nodeId);
    const isFilteredOut = filteredChildrenIds?.has(nodeId);
    const hasFilterOverride = overrideFilterIds?.has(nodeId);
    
    let toggleButtonText = '';
    let toggleButtonColor = '';
    
    if (isHiddenManually) {
        toggleButtonText = 'Показать потомков';
        toggleButtonColor = 'text-red-600 hover:text-red-500';
    } else if (isFilteredOut) {
        if (hasFilterOverride) {
            toggleButtonText = 'Скрыть потомков (отфильтрованные)';
            toggleButtonColor = 'text-yellow-600 hover:text-yellow-500';
        } else {
            toggleButtonText = 'Показать потомков (переопределить фильтр)';
            toggleButtonColor = 'text-yellow-600 hover:text-yellow-500';
        }
    } else if (hasChildren) {
        toggleButtonText = 'Скрыть потомков';
        toggleButtonColor = 'text-green-600 hover:text-green-500';
    }

    const handleViewInGrid = () => {
        if (!node) return;

        try {
            // Prepare root node data for localStorage
            const root = findRootNode(node);
            const rootData = root.data ? root.data : root;
            
            // Ensure all necessary data is present
            const preparedData = {
                ...rootData,
                id: rootData.id || getNodeIdentifier(root),
                state: rootData.state || '',
                statistics: rootData.statistics || {},
                children: rootData.children || []
            };

            // Save tree data to localStorage
            localStorage.setItem('treeData', JSON.stringify(preparedData));

            // Calculate and prepare node path
            const nodePath = calculateNodePath(node);
            
            if (nodePath && nodePath.length > 0) {
                const pathString = formatPathForUrl(nodePath);
                window.open(`/grid-path/${pathString}`, '_blank');
            } else {
                window.open('/grid', '_blank');
            }
        } catch (error) {
            console.error("Ошибка перехода к табличному просмотру:", error);
            window.open('/grid', '_blank');
        }
        
        onClose();
    };

    const handleToggleStatistics = () => {
        setShowStats(prev => !prev);
    };

    const showToggleButton = hasChildren;

    return (
        <div 
            ref={menuRef}
            className="fixed z-50 bg-white rounded shadow-lg border"
            style={{
                left: `${menuPosition.x}px`,
                top: `${menuPosition.y}px`
            }}
            onClick={e => e.stopPropagation()}
        >
            <div className="p-2 min-w-[250px] relative">
                <div className="relative">
                    <button 
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded flex justify-between items-center"
                        onClick={handleToggleStatistics}
                    >
                        <span>Просмотр статистики</span>
                        {showStats ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11l7-7 7 7M5 19l7-7 7 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        )}
                    </button>
                    {showStats && (
                        <Statistics 
                            data={node?.data} 
                            node={node} 
                            onClose={() => setShowStats(false)} 
                        />
                    )}
                </div>

                
                <div className="my-1 h-px bg-gray-200"></div>
                <button 
                    className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-gray-100 rounded"
                    onClick={handleViewInGrid}
                >
                    Просмотр в таблице
                </button>

                {showToggleButton && (
                    <>
                        <div className="my-1 h-px bg-gray-200"></div>
                        <button 
                            className={`w-full px-3 py-2 text-left text-sm ${toggleButtonColor} hover:bg-gray-100 rounded`}
                            onClick={onToggleExpansion}
                        >
                            {toggleButtonText}
                        </button>
                    </>
                )}


<div className="my-1 h-px bg-gray-200"></div>
    <div className="px-3 py-2 text-xs text-gray-500">
        <div className="mb-1">Статус узла:</div>
        
        {/* Определяем состояния узла с использованием переданных props */}
        {(() => {
            const isPlayout = node?.data?.isPlayout || false;
            const nodeId = getNodeIdentifier(node);
            
            // Используем переданные изменения вместо глобального состояния
            const isNew = highlightChanges && changes?.newNodes?.includes(nodeId) || false;
            const isUpdated = highlightChanges && changes?.updatedNodes?.some(n => n.id === nodeId) || false;
            
            // Рендерим состояния
            return (
                <div className="space-y-1">
                    {/* Комбинированные состояния */}
                    {isNew && isPlayout && (
                        <div className="flex items-center">
                            <div className="flex mr-2">
                                <span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span>
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            </div>
                            <span className="text-green-600 font-medium">Новый узел с playout</span>
                        </div>
                    )}
                    
                    {isUpdated && isPlayout && !isNew && (
                        <div className="flex items-center">
                            <div className="flex mr-2">
                                <span className="w-2 h-2 rounded-full bg-blue-500 mr-1"></span>
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                            </div>
                            <span className="text-blue-600 font-medium">Обновленный узел с playout</span>
                        </div>
                    )}
                    
                    {/* Отдельные состояния */}
                    {isPlayout && !isNew && !isUpdated && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                            <span className="text-purple-600 font-medium">Выполнен playout</span>
                        </div>
                    )}
                    
                    {isNew && !isPlayout && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            <span className="text-green-600 font-medium">Новый узел</span>
                        </div>
                    )}
                    
                    {isUpdated && !isPlayout && !isNew && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                            <span className="text-blue-600 font-medium">Обновленный узел</span>
                        </div>
                    )}
                    
                    {/* Если никаких специальных состояний нет */}
                    {!isNew && !isUpdated && !isPlayout && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-gray-400 mr-2"></span>
                            <span>Обычный узел</span>
                        </div>
                    )}
                </div>
            );
        })()}
        
        {/* Остальной код состояний видимости остается без изменений */}
        <div className="mt-2 space-y-1">
            {/* ... существующий код для hiddenChildrenIds, filteredChildrenIds и т.д. ... */}
        </div>

        {/* Отображение nodeId */}
        <div className="mt-2 text-xs text-gray-500">
            <div className="mb-1">ID узла:</div>
            <span className="font-mono">{nodeId}</span>
        </div>
        
        {/* Дополнительная информация о playout */}
        {node?.data?.isPlayout && (
            <div className="mt-2 text-xs text-purple-600 bg-purple-50 p-2 rounded">
                <div className="font-medium mb-1">Playout информация:</div>
                <div>Узел подвергся симуляции до конца игры в рамках алгоритма MCTS</div>
            </div>
        )}
        
        {/* Информация об изменениях */}
        {highlightChanges && changes && (() => {
            const nodeId = getNodeIdentifier(node);
            const updatedNode = changes.updatedNodes?.find(n => n.id === nodeId);
            
            if (updatedNode) {
                return (
                    <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded">
                        <div className="font-medium mb-1">Изменения:</div>
                        <div>Посещений добавлено: +{updatedNode.change}</div>
                        <div>Было: {updatedNode.prevVisits}, стало: {updatedNode.currentVisits}</div>
                    </div>
                );
            }
            
            return null;
        })()} 
    </div>
            </div>
        </div>
    );
};

export default ContextMenu;