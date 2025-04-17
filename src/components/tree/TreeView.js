// src/components/tree/TreeView.js
import React, { useState } from 'react';
import { useGraphInteraction } from '../../hooks/useGraphInteraction';
import { useTreeFiltering } from '../../hooks/useTreeFiltering';
import { useNodeState } from '../../hooks/useNodeState';
import { useContextMenuHandler } from '../../hooks/useContextMenuHandler';
import TreeVisualizer from './TreeVisualizer';
import FilterControls from './FilterControls';
import ContextMenu from './ContextMenu';
import LoadingIndicator from '../common/LoadingIndicator';
import { ErrorMessage } from '../common/ErrorMessage';

const TreeView = ({ 
    data, 
    onError, 
    changes,
    highlightChanges = false
}) => {
    const [isLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalNodes: 0,
        visibleNodes: 0,
        maxDepth: 0
    });
    
    // Set up graph interaction
    const { 
        setupNodeDrag, 
        setupGraphPan, 
        customNodePositions,
        setCustomNodePositions,
        resetNodePosition
    } = useGraphInteraction();
    
    // Set up tree filtering
    const {
        filters,
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds,
        toggleNodeExpansion,
        toggleFilterOverride,
        applyFilters,
        resetFilters,
        shouldShowNode
    } = useTreeFiltering(data);
    
    // Set up node state determination
    const { getNodeState } = useNodeState(
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds
    );
    
    // Set up context menu
    const {
        contextMenu,
        handleContextMenu,
        handleCloseContextMenu,
        handleToggleExpansion
    } = useContextMenuHandler(
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds,
        toggleNodeExpansion,
        toggleFilterOverride
    );
    
    // Handlers
    const handleError = (err) => {
        setError(err.message || String(err));
        if (onError) onError(err);
    };
    
    const handleStatsUpdate = (newStats) => {
        setStats(newStats);
    };
    
    const handleResetFilters = () => {
        resetFilters();
        setCustomNodePositions(new Map());
    };

    // Handle errors
    if (error) {
        return (
            <ErrorMessage
                message={error}
                onReset={handleResetFilters}
            />
        );
    }

    // Handle loading state
    if (isLoading) {
        return <LoadingIndicator message="Processing tree data..." />;
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            {/* Control panel */}
            <div className="flex-none h-12 bg-white border-b flex items-center px-4">
                <FilterControls
                    currentFilters={filters}
                    onApplyFilters={applyFilters}
                    onResetFilters={handleResetFilters}
                    maxDepth={stats.maxDepth}
                    totalNodes={stats.totalNodes}
                />
                <div className="ml-4 text-sm text-gray-500">
                    Showing {stats.visibleNodes} of {stats.totalNodes} nodes
                </div>
                
                {/* Changes information */}
                {changes && highlightChanges && (
                    <div className="ml-auto flex items-center space-x-4">
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-green-500 mr-1"></div>
                            <span className="text-xs">New nodes: {changes.newNodes.length}</span>
                        </div>
                        <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-blue-500 mr-1"></div>
                            <span className="text-xs">Updated nodes: {changes.updatedNodes.length}</span>
                        </div>
                    </div>
                )}
            </div>

            {/* Tree visualization area */}
            <div className="flex-1 relative">
                <TreeVisualizer
                    data={data}
                    shouldShowNode={shouldShowNode}
                    getNodeState={getNodeState}
                    hiddenChildrenIds={hiddenChildrenIds}
                    filteredChildrenIds={filteredChildrenIds}
                    overrideFilterIds={overrideFilterIds}
                    toggleNodeExpansion={toggleNodeExpansion}
                    toggleFilterOverride={toggleFilterOverride}
                    handleContextMenu={handleContextMenu}
                    setupNodeDrag={setupNodeDrag}
                    setupGraphPan={setupGraphPan}
                    customNodePositions={customNodePositions}
                    changes={changes}
                    highlightChanges={highlightChanges}
                    onError={handleError}
                    onStatsUpdate={handleStatsUpdate}
                />
                
                {/* Context menu */}
                {contextMenu.visible && (
                    <ContextMenu
                        {...contextMenu}
                        onClose={handleCloseContextMenu}
                        onToggleExpansion={handleToggleExpansion}
                        onResetNodePosition={resetNodePosition}
                        filteredChildrenIds={filteredChildrenIds}
                        hiddenChildrenIds={hiddenChildrenIds}
                        overrideFilterIds={overrideFilterIds}
                    />
                )}
            </div>
        </div>
    );
};

export default React.memo(TreeView);