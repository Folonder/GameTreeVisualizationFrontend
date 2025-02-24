// src/components/tree/ContextMenu.js
import React, { useState } from 'react';

const Statistics = ({ stats }) => {
    if (!stats) return null;

    return (
        <div className="absolute right-full top-0 mr-2 bg-white rounded shadow-lg border p-2 min-w-[250px]">
            <div className="space-y-2">
                <div className="flex gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Visits:</span>{' '}
                        <span className="font-medium">{stats.numVisits}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Relative:</span>{' '}
                        <span className="font-medium">{Math.round(stats.relativeVisits)}%</span>
                    </div>
                </div>
                
                {stats.statisticsForActions?.map((roleStat, index) => (
                    <div key={index} className="space-y-1">
                        <div className="text-xs font-medium text-gray-500">{roleStat.role}</div>
                        <div className="space-y-0.5">
                            {roleStat.actions.map((action, actionIndex) => (
                                <div key={actionIndex} className="text-sm flex gap-2">
                                    <span className="text-gray-600">{action.action}:</span>
                                    <span className="font-medium">
                                        {Math.round(action.averageActionScore * 100) / 100}
                                    </span>
                                    <span className="text-gray-400">
                                        ({action.actionNumUsed})
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const ContextMenu = ({ x, y, onClose, onHideChildren, onShowChildren, isHidden, node }) => {
    const [showStats, setShowStats] = useState(false);

    if (!node?.data?.statistics) return null;
    const stats = node.data.statistics;

    const hasChildren = node.children && node.children.length > 0;

    return (
        <div 
            className="fixed z-50 bg-white rounded shadow-lg border p-2"
            style={{ left: x, top: y }}
            onClick={e => e.stopPropagation()}
        >
            <div className="space-y-1">
                {/* Кнопка статистики */}
                <div className="relative">
                    <button 
                        className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded text-left"
                        onMouseEnter={() => setShowStats(true)}
                        onMouseLeave={() => setShowStats(false)}
                    >
                        View statistics
                    </button>
                    {showStats && <Statistics stats={stats} />}
                </div>

                {/* Разделитель */}
                <div className="h-px bg-gray-200 my-1"></div>

                {/* Кнопки управления отображением */}
                {hasChildren && (
                    <button 
                        className="w-full px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded text-left"
                        onClick={() => {
                            isHidden ? onShowChildren(node) : onHideChildren();
                            onClose();
                        }}
                    >
                        {isHidden ? 'Show children' : 'Hide children'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default ContextMenu;