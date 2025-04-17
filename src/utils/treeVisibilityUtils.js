// src/utils/treeVisibilityUtils.js
import * as d3 from 'd3';

export const processNodeVisibility = (data, shouldShowNode, getNodeState) => {
    if (!data) return { visibleNodes: [], nodeStates: new Map() };
    
    const hierarchy = d3.hierarchy(data);
    const visibleNodes = [];
    const nodeStates = new Map();
    
    const processNode = (node, isParentVisible = true, depth = 0) => {
        const shouldShow = isParentVisible && shouldShowNode(node);
        
        if (shouldShow) {
            visibleNodes.push(node);
            nodeStates.set(node, getNodeState(node));
        }
        
        if (node.children && (!shouldShow || depth >= 50)) {
            return;
        }
        
        if (node.children) {
            node.children.forEach(child => {
                processNode(child, shouldShow, depth + 1);
            });
        }
    };
    
    processNode(hierarchy, true, 0);
    
    return { visibleNodes, nodeStates };
};

export const createNodeMap = (tree) => {
    const map = new Map();
    
    const processNode = (node) => {
        if (!node) return;
        
        map.set(node.id, {
            visits: node.statistics?.numVisits || 0,
            state: node.state,
            hasChildren: node.children && node.children.length > 0
        });
        
        if (node.children && node.children.length > 0) {
            node.children.forEach(processNode);
        }
    };
    
    processNode(tree);
    return map;
};

export const calculateChanges = (currentTree, previousStepMap) => {
    if (!previousStepMap) return { newNodes: [], updatedNodes: [] };
    
    const changes = {
        newNodes: [],
        updatedNodes: []
    };
    
    const processNode = (node) => {
        if (!node) return;
        
        if (!previousStepMap.has(node.id)) {
            changes.newNodes.push(node.id);
        } else {
            const prevNodeInfo = previousStepMap.get(node.id);
            const currentVisits = node.statistics?.numVisits || 0;
            
            if (currentVisits > prevNodeInfo.visits) {
                changes.updatedNodes.push({
                    id: node.id,
                    prevVisits: prevNodeInfo.visits,
                    currentVisits: currentVisits,
                    change: currentVisits - prevNodeInfo.visits
                });
            }
        }
        
        if (node.children && node.children.length > 0) {
            node.children.forEach(processNode);
        }
    };
    
    processNode(currentTree);
    return changes;
};