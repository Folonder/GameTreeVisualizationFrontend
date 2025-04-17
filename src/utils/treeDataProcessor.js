// src/utils/treeDataProcessor.js
import * as d3 from 'd3';
import { getNodeIdentifier } from './treeUtils';

export function prepareHierarchyData(data) {
    if (!data) return { hierarchy: null, allNodes: [] };
    
    const hierarchy = d3.hierarchy(data);
    const allNodes = hierarchy.descendants();
    
    // Add unique IDs for nodes that don't have them
    allNodes.forEach(node => {
        if (!node.data.id) {
            node.data.id = getNodeIdentifier(node);
        }
    });
    
    return { hierarchy, allNodes };
}

export function processVisibleNodes(root, shouldShowNode, getNodeState) {
    const visibleNodes = [];
    const nodeStates = new Map();
    
    const processNode = (node, isParentVisible = true) => {
        if (!node) return;
        
        const shouldShow = isParentVisible && shouldShowNode(node);
        
        if (shouldShow) {
            visibleNodes.push(node);
            nodeStates.set(node, getNodeState(node));
            
            if (node.children) {
                node.children.forEach(child => {
                    processNode(child, true);
                });
            }
        }
    };
    
    processNode(root, true);
    return { visibleNodes, nodeStates };
}

export function createVisibleLinks(visibleNodes) {
    const visibleLinks = [];
    
    for (const node of visibleNodes) {
        if (node.parent && visibleNodes.includes(node.parent)) {
            visibleLinks.push({ source: node.parent, target: node });
        }
    }
    
    return visibleLinks;
}

export function calculateTreeStatistics(allNodes) {
    const totalNodes = allNodes.length;
    const maxDepth = allNodes.length ? Math.max(...allNodes.map(d => d.depth), 0) : 0;
    
    return {
        totalNodes,
        maxDepth,
    };
}

export function markNodesWithHiddenChildren(visibleNodes, hiddenChildrenIds, filteredChildrenIds, overrideFilterIds) {
    const nodesWithHiddenChildren = new Set();
    
    visibleNodes.forEach(node => {
        const nodeId = getNodeIdentifier(node);
        
        if (hiddenChildrenIds.has(nodeId) || 
            (filteredChildrenIds.has(nodeId) && !overrideFilterIds.has(nodeId))) {
            nodesWithHiddenChildren.add(nodeId);
        }
    });
    
    return nodesWithHiddenChildren;
}