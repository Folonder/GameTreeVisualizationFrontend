// src/hooks/useContextMenuHandler.js
import { useState, useCallback } from 'react';
import { getNodeIdentifier } from '../utils/treeUtils';

/**
 * Custom hook for handling tree context menu operations
 */
export const useContextMenuHandler = (
    hiddenChildrenIds,
    filteredChildrenIds,
    overrideFilterIds,
    toggleNodeExpansion,
    toggleFilterOverride
) => {
    const [contextMenu, setContextMenu] = useState({ 
        visible: false, 
        x: 0, 
        y: 0, 
        node: null,
        nodeState: null
    });

    /**
     * Shows context menu for a node
     */
    const handleContextMenu = useCallback((event, node, nodeState) => {
        event.preventDefault();
        event.stopPropagation();
        
        // Get unique identifier for the node
        const nodeId = getNodeIdentifier(node);
        
        // Debug output to check node data
        console.log("Context menu opened for node:", node);
        console.log("Node depth:", node.depth);
        console.log("Node identifier:", nodeId);
        console.log("Node has children:", node.children?.length > 0);
        console.log("Children are hidden manually:", hiddenChildrenIds.has(nodeId));
        console.log("Children are filtered:", filteredChildrenIds.has(nodeId));
        console.log("Filter override:", overrideFilterIds.has(nodeId));
        
        setContextMenu({
            visible: true,
            x: event.pageX,
            y: event.pageY,
            node: node, // Important: pass the complete node object
            nodeState: nodeState
        });
    }, [hiddenChildrenIds, filteredChildrenIds, overrideFilterIds]);

    /**
     * Closes the context menu
     */
    const handleCloseContextMenu = useCallback(() => {
        console.log("Closing context menu");
        setContextMenu({ visible: false, x: 0, y: 0, node: null, nodeState: null });
    }, []);

    /**
     * Toggles node expansion from the context menu
     */
    const handleToggleExpansion = useCallback(() => {
        if (contextMenu.node) {
            const nodeId = getNodeIdentifier(contextMenu.node);
            
            // If the node has children that are explicitly hidden
            if (hiddenChildrenIds.has(nodeId)) {
                toggleNodeExpansion(contextMenu.node);
            } 
            // If the node has children that are hidden by filters
            else if (filteredChildrenIds.has(nodeId)) {
                toggleFilterOverride(contextMenu.node);
            } 
            // If the node has children and they're not hidden, hide them
            else if (contextMenu.node.children && contextMenu.node.children.length > 0) {
                toggleNodeExpansion(contextMenu.node);
            }
            
            handleCloseContextMenu();
        }
    }, [
        contextMenu.node, 
        hiddenChildrenIds, 
        filteredChildrenIds, 
        toggleNodeExpansion, 
        toggleFilterOverride, 
        handleCloseContextMenu
    ]);

    return {
        contextMenu,
        handleContextMenu,
        handleCloseContextMenu,
        handleToggleExpansion
    };
};