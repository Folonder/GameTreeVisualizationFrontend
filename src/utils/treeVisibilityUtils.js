// src/utils/treeVisibilityUtils.js
import * as d3 from 'd3';

export const createNodeMap = (tree) => {
    if (!tree) return new Map();

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
    if (!previousStepMap || previousStepMap.size === 0) return { newNodes: [], updatedNodes: [] };
    
    const changes = {
        newNodes: [],
        updatedNodes: []
    };
    
    const processNode = (node) => {
        if (!node) return;
        
        if (!node.id) {
            // Узел без ID не может быть сравнен
            return;
        }
        
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