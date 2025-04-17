// src/utils/nodeRenderUtils.js
import { TREE_CONSTANTS } from '../components/tree/constants';
import { getNodeStyle } from '../components/tree/NodeStyles';
import { getNodeIdentifier } from './treeUtils';

export const getNodeRadius = (node, nodeCount, totalRootVisits = 100) => {
    const visits = node.data.statistics?.numVisits || 0;
    
    const isTinyTree = nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.NODE_COUNT;
    const isSmallTree = nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT;
    
    const baseMaxRadius = isTinyTree 
        ? TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS * 2
        : isSmallTree 
            ? TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS * 1.5
            : TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS;
            
    const baseMinRadius = isTinyTree 
        ? TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS * 1.2
        : isSmallTree 
            ? TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS * 1.1
            : TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS;
    
    if (totalRootVisits < TREE_CONSTANTS.ADAPTIVE_SCALING.VISITS_THRESHOLD.INITIAL_LARGE) {
        return baseMaxRadius * 0.8;
    }
    
    const visitRatio = visits / totalRootVisits;
    const radius = baseMinRadius + (baseMaxRadius - baseMinRadius) * visitRatio;
    
    return radius;
};

export const getNodeChangeStyle = (node, changes, highlightChanges) => {
    if (!highlightChanges || !changes) return {};
    
    const nodeId = node.data.id || getNodeIdentifier(node);
    
    if (changes.newNodes && changes.newNodes.includes(nodeId)) {
        return {
            stroke: '#4caf50',    // Зеленый контур
            strokeWidth: 4,       // Толстый контур
            fill: '#b9f6ca',      // Светло-зеленый фон
            fillOpacity: 0.8,     // Полупрозрачный фон
            strokeOpacity: 1
        };
    }
    
    const updatedNode = changes.updatedNodes && 
        changes.updatedNodes.find(n => n.id === nodeId);
    
    if (updatedNode) {
        const changeRatio = Math.min(1, updatedNode.change / 20);
        return {
            stroke: '#2196f3',   // Синий контур
            strokeWidth: 2 + 2 * changeRatio,
            strokeDasharray: updatedNode.change > 10 ? '5,2' : '',
            fill: '#bbdefb',     // Светло-синий фон
            fillOpacity: 0.6 + 0.4 * changeRatio,   // Интенсивность зависит от величины изменения
            strokeOpacity: 1
        };
    }
    
    return {};
};

export const applyNodeStyles = (node, nodeState, visits, changeStyle = {}) => {
    const baseStyle = getNodeStyle(nodeState, visits);
    
    Object.entries(baseStyle).forEach(([key, value]) => {
        node.style(key, value);
    });
    
    Object.entries(changeStyle).forEach(([key, value]) => {
        node.style(key, value);
    });
};