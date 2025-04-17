// src/components/tree/TreeVisualizer.js
import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useTreeRenderer } from '../../hooks/useTreeRenderer';
import { calculateNodePercentage } from '../../utils/treeUtils';

/**
 * Component responsible for D3 visualization of tree data
 */
const TreeVisualizer = ({
    data,
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
    customNodePositions,
    changes,
    highlightChanges,
    onError,
    onStatsUpdate
}) => {
    const {
        svgRef,
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
        customNodePositions,
        changes,
        highlightChanges
    });

    // Notify parent about stats updates
    useEffect(() => {
        if (onStatsUpdate && stats) {
            onStatsUpdate(stats);
        }
    }, [stats, onStatsUpdate]);

    // Handle error propagation to parent component
    useEffect(() => {
        if (error && onError) {
            onError(error);
        }
    }, [error, onError]);

    return (
        <svg 
            ref={svgRef} 
            className="w-full h-full"
            style={{ background: 'white' }}
            onContextMenu={(e) => e.preventDefault()}
        />
    );
};

TreeVisualizer.propTypes = {
    data: PropTypes.object,
    shouldShowNode: PropTypes.func.isRequired,
    getNodeState: PropTypes.func.isRequired,
    hiddenChildrenIds: PropTypes.instanceOf(Set).isRequired,
    filteredChildrenIds: PropTypes.instanceOf(Set).isRequired,
    overrideFilterIds: PropTypes.instanceOf(Set).isRequired,
    toggleNodeExpansion: PropTypes.func.isRequired,
    toggleFilterOverride: PropTypes.func.isRequired,
    handleContextMenu: PropTypes.func.isRequired,
    setupNodeDrag: PropTypes.func.isRequired,
    setupGraphPan: PropTypes.func.isRequired,
    customNodePositions: PropTypes.instanceOf(Map).isRequired,
    changes: PropTypes.object,
    highlightChanges: PropTypes.bool,
    onError: PropTypes.func,
    onStatsUpdate: PropTypes.func
};

export default React.memo(TreeVisualizer);