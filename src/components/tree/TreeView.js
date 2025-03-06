// src/components/tree/TreeView.js
import React from 'react';
import { useGraphInteraction } from '../../hooks/useGraphInteraction';
import { useTreeFiltering } from '../../hooks/useTreeFiltering';
import { useNodeState } from '../../hooks/useNodeState';
import { useContextMenuHandler } from '../../hooks/useContextMenuHandler';
import { useTreeRenderer } from './TreeRenderer';
import { calculateNodePercentage } from '../../utils/treeUtils';
import FilterControls from './FilterControls';
import ContextMenu from './ContextMenu';
import LoadingIndicator from '../common/LoadingIndicator';
import { ErrorMessage } from '../common/ErrorMessage';

/**
 * Main component for tree visualization
 * Combines filtering, rendering, and interaction logic
 */
const TreeView = ({ data, onError }) => {
    // Set up graph interaction (dragging, panning, zooming)
    const { setupNodeDrag, setupGraphPan, savedTransform, updateTransform } = useGraphInteraction();
    
    // Set up tree filtering logic
    const {
        filters,
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds,
        isFilteredByFilters,
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
    
    // Set up context menu handling
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
    
    // Set up tree rendering
    const {
        svgRef,
        renderTree,
        isLoading,
        error,
        stats
    } = useTreeRenderer({
        data,
        onError,
        shouldShowNode,
        getNodeState,
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds,
        toggleNodeExpansion,
        toggleFilterOverride,
        handleContextMenu,
        setupNodeDrag,
        setupGraphPan,
        calculateNodePercentage,
        savedTransform,
        updateTransform // Добавлен новый параметр
    });

    if (error) {
        return (
            <ErrorMessage
                message={error}
                onRetry={renderTree}
                onReset={resetFilters}
            />
        );
    }

    if (isLoading) {
        return <LoadingIndicator message="Processing tree data..." />;
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden">
            <div className="flex-none h-12 bg-white border-b flex items-center px-4">
                <FilterControls
                    currentFilters={filters}
                    onApplyFilters={applyFilters}
                    onResetFilters={resetFilters}
                    maxDepth={stats.maxDepth}
                    totalNodes={stats.totalNodes}
                />
                <div className="ml-4 text-sm text-gray-500">
                    Showing {stats.visibleNodes} of {stats.totalNodes} nodes
                </div>
                
                {/* Debug information about hidden nodes */}
                <div className="ml-4 text-xs text-gray-400">
                    Hidden manually: {hiddenChildrenIds.size} | 
                    Hidden by filters: {filteredChildrenIds.size} |
                    Filter overrides: {overrideFilterIds.size}
                </div>
            </div>
            <div className="flex-1 relative">
                <svg 
                    ref={svgRef} 
                    className="w-full h-full"
                    style={{ background: 'white' }}
                    onContextMenu={(e) => e.preventDefault()}
                />
                {contextMenu.visible && (
                    <ContextMenu
                        {...contextMenu}
                        onClose={handleCloseContextMenu}
                        onToggleExpansion={handleToggleExpansion}
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