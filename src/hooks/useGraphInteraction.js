// src/hooks/useGraphInteraction.js
import { useCallback, useState, useRef } from 'react';
import { setupNodeDrag } from '../utils/nodePositionUtils';
import { setupGraphPan } from '../utils/zoomPanUtils';

export const useGraphInteraction = () => {
    const [savedTransform, setSavedTransform] = useState(null);
    const isTransformSet = useRef(false);
    const activeTransformRef = useRef(null);
    const [customNodePositions, setCustomNodePositions] = useState(new Map());
    
    const updateNodePosition = useCallback((nodeId, position) => {
        setCustomNodePositions(prev => {
            const newMap = new Map(prev);
            newMap.set(nodeId, position);
            return newMap;
        });
    }, []);
    
    const resetNodePosition = useCallback((nodeId) => {
        setCustomNodePositions(prev => {
            const newMap = new Map(prev);
            newMap.delete(nodeId);
            
            for (const [key] of prev.entries()) {
                if (key.startsWith(nodeId + '-') || key.includes('-' + nodeId + '-')) {
                    newMap.delete(key);
                }
            }
            
            return newMap;
        });
    }, []);

    const createNodeDragHandler = useCallback(() => {
        return setupNodeDrag(updateNodePosition);
    }, [updateNodePosition]);
    
    const createGraphPanHandler = useCallback((svg, mainGroup, nodeCount) => {
        return setupGraphPan(
            svg, 
            mainGroup, 
            nodeCount,
            savedTransform,
            isTransformSet,
            activeTransformRef,
            setSavedTransform
        );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [savedTransform]);
    
    const updateTransform = useCallback((newTransform) => {
        activeTransformRef.current = newTransform;
        setSavedTransform(newTransform);
    }, []);

    return { 
        setupNodeDrag: createNodeDragHandler, 
        setupGraphPan: createGraphPanHandler, 
        savedTransform, 
        updateTransform,
        customNodePositions,
        setCustomNodePositions,
        resetNodePosition
    };
}