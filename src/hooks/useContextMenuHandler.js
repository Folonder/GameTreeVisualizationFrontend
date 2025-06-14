// src/hooks/useContextMenuHandler.js

import { useState, useCallback } from 'react';
import { getNodeIdentifier } from '../utils/treeUtils';

export const useContextMenuHandler = (
    hiddenChildrenIds,
    filteredChildrenIds,
    overrideFilterIds,
    toggleNodeExpansion,
    toggleFilterOverride,
    changes = null,           // Добавляем параметр changes
    highlightChanges = false  // Добавляем параметр highlightChanges
) => {
    const [contextMenu, setContextMenu] = useState({ 
        visible: false, 
        x: 0, 
        y: 0, 
        node: null,
        nodeState: null,
        changes: null,           // Добавляем в состояние
        highlightChanges: false  // Добавляем в состояние
    });

    const handleContextMenu = useCallback((event, node, nodeState) => {
        event.preventDefault();
        event.stopPropagation();
        
        setContextMenu({
            visible: true,
            x: event.pageX,
            y: event.pageY,
            node: node,
            nodeState: nodeState,
            changes: changes,           // Передаем changes
            highlightChanges: highlightChanges  // Передаем highlightChanges
        });
    }, [changes, highlightChanges]);  // Добавляем в зависимости

    const handleCloseContextMenu = useCallback(() => {
        setContextMenu({ 
            visible: false, 
            x: 0, 
            y: 0, 
            node: null, 
            nodeState: null,
            changes: null,
            highlightChanges: false
        });
    }, []);

    const handleToggleExpansion = useCallback(() => {
        if (contextMenu.node) {
            const nodeId = getNodeIdentifier(contextMenu.node);
            
            if (hiddenChildrenIds.has(nodeId)) {
                toggleNodeExpansion(contextMenu.node);
            } 
            else if (filteredChildrenIds.has(nodeId)) {
                toggleFilterOverride(contextMenu.node);
            } 
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