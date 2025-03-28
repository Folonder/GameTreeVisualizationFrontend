// src/components/tree/ContextMenu.js - исправленный View in Grid
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TREE_CONSTANTS } from './constants';
import { getNodeIdentifier, calculateNodePercentageFromRoot } from '../../utils/treeUtils';
import { calculateNodePath, formatPathForUrl } from '../../utils/gridUtils';

const Statistics = ({ data, node }) => {
    if (!data?.statistics) return null;
    const stats = data.statistics;
    
    // Вычисляем процент от корня с точностью до сотых
    const percentFromRoot = (calculateNodePercentageFromRoot(node)).toFixed(2);

    return (
        <div className="absolute left-full top-0 ml-2 bg-white rounded shadow-lg border p-4 min-w-[300px]">
            <div className="space-y-3">
                {/* Основная статистика */}
                <div>
                    <h3 className="text-sm font-medium text-gray-500 mb-2">Basic Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <span className="text-sm text-gray-500">Visits:</span>
                            <span className="ml-2 font-medium">{stats.numVisits}</span>
                        </div>
                        <div>
                            <span className="text-sm text-gray-500">Relative to root:</span>
                            <span className="ml-2 font-medium">{percentFromRoot}%</span>
                        </div>
                    </div>
                </div>

                {/* Статистика по действиям */}
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
    onClose, 
    onToggleExpansion,
    onResetNodePosition 
}) => {
    const navigate = useNavigate();
    const [showStats, setShowStats] = useState(false);
    const menuRef = useRef(null);

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

    useEffect(() => {
        if (!menuRef.current) return;

        const menu = menuRef.current;
        const rect = menu.getBoundingClientRect();
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;

        // Корректируем позицию, чтобы меню не выходило за пределы экрана
        let menuX = x;
        let menuY = y;

        if (x + rect.width > viewportWidth) {
            menuX = viewportWidth - rect.width - 10;
        }

        if (y + rect.height > viewportHeight) {
            menuY = viewportHeight - rect.height - 10;
        }

        menu.style.left = `${menuX}px`;
        menu.style.top = `${menuY}px`;
    }, [x, y]);

    // Проверяем, есть ли у узла дети
    const hasChildren = node?.children && node.children.length > 0;
    
    // Получаем идентификатор узла
    const nodeId = getNodeIdentifier(node);
    
    // Определяем состояние узла
    const isHiddenManually = hiddenChildrenIds?.has(nodeId);
    const isFilteredOut = filteredChildrenIds?.has(nodeId);
    const hasFilterOverride = overrideFilterIds?.has(nodeId);
    
    // Определяем тип кнопки и текст для переключения видимости
    let toggleButtonText = '';
    let toggleButtonColor = '';
    
    if (isHiddenManually) {
        toggleButtonText = 'Show Children';
        toggleButtonColor = 'text-red-600 hover:text-red-500';
    } else if (isFilteredOut) {
        if (hasFilterOverride) {
            toggleButtonText = 'Hide Children (Filtered)';
            toggleButtonColor = 'text-yellow-600 hover:text-yellow-500';
        } else {
            toggleButtonText = 'Show Children (Override Filter)';
            toggleButtonColor = 'text-yellow-600 hover:text-yellow-500';
        }
    } else if (hasChildren) {
        toggleButtonText = 'Hide Children';
        toggleButtonColor = 'text-green-600 hover:text-green-500';
    }

    // Обработчик клика по кнопке Hide/Show Children
    const handleToggleClick = () => {
        onToggleExpansion();
    };
    
    // Обработчик для сброса позиции узла
    const handleResetPosition = () => {
        if (onResetNodePosition && nodeId) {
            onResetNodePosition(nodeId);
            onClose();
        }
    };
    
    const handleViewInGrid = () => {
        if (node) {
          // Используем путь узла вместо ID
          try {
            const nodePath = calculateNodePath(node);
            if (nodePath && nodePath.length > 0) {
                const pathString = formatPathForUrl(nodePath);
                // Открываем в новом окне
                window.open(`/grid-path/${pathString}`, '_blank');
            } else {
                // Для корневого узла просто открываем страницу сетки
                window.open('/grid', '_blank');
            }
          } catch (error) {
            console.error("Error navigating to grid view:", error);
          }
          onClose();
        }
    };

    // Отображаем кнопку переключения только если у узла есть дети
    const showToggleButton = hasChildren;

    return (
        <div 
            ref={menuRef}
            className="fixed z-50 bg-white rounded shadow-lg border"
            style={{
                left: `${x}px`,
                top: `${y}px`
            }}
            onClick={e => e.stopPropagation()}
        >
            <div className="p-2 min-w-[200px]">
                {/* Статистика */}
                <div className="relative">
                    <button 
                        className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 rounded"
                        onMouseEnter={() => setShowStats(true)}
                        onMouseLeave={() => setShowStats(false)}
                    >
                        View Statistics
                    </button>
                    {showStats && <Statistics data={node?.data} node={node} />}
                </div>

                {/* Кнопка сброса позиции */}
                <div className="my-1 h-px bg-gray-200"></div>
                <button 
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-gray-100 rounded"
                    onClick={handleResetPosition}
                >
                    Reset Node Position
                </button>
                
                <div className="my-1 h-px bg-gray-200"></div>
                <button 
                    className="w-full px-3 py-2 text-left text-sm text-green-600 hover:bg-gray-100 rounded"
                    onClick={handleViewInGrid}
                >
                    View in Grid
                </button>

                {/* Разделитель и кнопка Hide/Show Children если у узла есть дети */}
                {showToggleButton && (
                    <>
                        <div className="my-1 h-px bg-gray-200"></div>
                        <button 
                            className={`w-full px-3 py-2 text-left text-sm ${toggleButtonColor} hover:bg-gray-100 rounded`}
                            onClick={handleToggleClick}
                        >
                            {toggleButtonText}
                        </button>
                    </>
                )}
                
                {/* Информация о состоянии узла */}
                <div className="my-1 h-px bg-gray-200"></div>
                <div className="px-3 py-2 text-xs text-gray-500">
                    <div className="mb-1">Node Status:</div>
                    {isHiddenManually && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span>
                            <span>Children are manually hidden</span>
                        </div>
                    )}
                    {isFilteredOut && !isHiddenManually && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                            <span>Children are hidden by filter</span>
                        </div>
                    )}
                    {hasFilterOverride && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                            <span>Filter override is active</span>
                        </div>
                    )}
                    {!isHiddenManually && !isFilteredOut && hasChildren && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                            <span>All children are visible</span>
                        </div>
                    )}
                    {!hasChildren && (
                        <div className="flex items-center">
                            <span className="w-2 h-2 rounded-full bg-gray-500 mr-2"></span>
                            <span>Leaf node (no children)</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ContextMenu;