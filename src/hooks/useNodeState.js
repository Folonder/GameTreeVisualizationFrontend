// src/hooks/useNodeState.js
import { useCallback } from 'react';
import { getNodeIdentifier } from '../utils/treeUtils';
import { TREE_CONSTANTS } from '../components/tree/constants';

export const useNodeState = (hiddenChildrenIds, filteredChildrenIds, overrideFilterIds) => {
    const getNodeState = useCallback((node) => {
        const nodeId = getNodeIdentifier(node);
        
        if (!node.children || node.children.length === 0) {
            return TREE_CONSTANTS.NODE_STATES.VISIBLE;
        }
        
        if (hiddenChildrenIds.has(nodeId)) {
            return TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN;
        }
        
        if (filteredChildrenIds.has(nodeId)) {
            if (overrideFilterIds.has(nodeId)) {
                return TREE_CONSTANTS.NODE_STATES.EXPANDED;
            }
            return TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN;
        }
        
        return TREE_CONSTANTS.NODE_STATES.EXPANDED;
    }, [hiddenChildrenIds, filteredChildrenIds, overrideFilterIds]);

    return { getNodeState };
};