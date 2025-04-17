// src/components/tree/ContextMenu.js
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
                    title="Close Statistics"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            <div className="space-y-3">
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
            console.error("Error navigating to grid view:", error);
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
                        <span>View Statistics</span>
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
                    className="w-full px-3 py-2 text-left text-sm text-blue-600 hover:bg-gray-100 rounded"
                    onClick={() => {
                        onResetNodePosition(nodeId);
                        onClose();
                    }}
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