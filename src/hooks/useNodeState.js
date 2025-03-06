// src/hooks/useNodeState.js
import { useCallback } from 'react';
import { getNodeIdentifier } from '../utils/treeUtils';
import { TREE_CONSTANTS } from '../components/tree/constants';

/**
 * Custom hook for determining node visual states based on their filtering status
 */
export const useNodeState = (hiddenChildrenIds, filteredChildrenIds, overrideFilterIds) => {
    /**
     * Determines the visual state of a node for styling purposes
     */
    const getNodeState = useCallback((node) => {
        const nodeId = getNodeIdentifier(node);
        
        // If the node has no children, it's a regular visible node
        if (!node.children || node.children.length === 0) {
            return TREE_CONSTANTS.NODE_STATES.VISIBLE;
        }
        
        // If the node has children that are explicitly hidden via Hide Children
        if (hiddenChildrenIds.has(nodeId)) {
            return TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN;
        }
        
        // If the node has children that are hidden due to filters
        if (filteredChildrenIds.has(nodeId)) {
            // If there's a filter override, the node is considered expanded (green)
            if (overrideFilterIds.has(nodeId)) {
                return TREE_CONSTANTS.NODE_STATES.EXPANDED;
            }
            return TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN;
        }
        
        // If all the node's children are visible
        return TREE_CONSTANTS.NODE_STATES.EXPANDED;
    }, [hiddenChildrenIds, filteredChildrenIds, overrideFilterIds]);

    return { getNodeState };
};