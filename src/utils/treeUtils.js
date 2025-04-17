// src/utils/treeUtils.js
export const getNodeIdentifier = (node) => {
    if (node.data && node.data.id) return node.data.id;
    
    const pathParts = [];
    let current = node;
    
    while (current) {
        let nodePart = '';
        
        if (current.parent && current.parent.children) {
            const index = current.parent.children.indexOf(current);
            nodePart = `${index}-`;
        }
        
        nodePart += current.data.state 
            ? `${current.data.state.slice(0, 20).replace(/\s+/g, '')}`
            : `depth-${current.depth}`;
        
        pathParts.unshift(nodePart);
        current = current.parent;
    }
    
    return `node-${pathParts.join('-')}`;
};

export const findRootNode = (node) => {
    if (!node) return null;
    
    let root = node;
    while (root.parent) {
        root = root.parent;
    }
    return root;
};

export const calculateNodePercentage = (node) => {
    if (!node.parent) return 100;
    
    const visits = node.data.statistics?.numVisits || 0;
    let totalVisits = 0;
    
    if (node.parent && node.parent.children) {
        totalVisits = node.parent.children.reduce((sum, child) => 
            sum + (child.data.statistics?.numVisits || 0), 0);
    }
    
    return totalVisits > 0 ? (visits / totalVisits * 100) : 0;
};

export const calculateNodePercentageFromRoot = (node) => {
    const root = findRootNode(node);
    
    if (node === root) return 100;
    
    const nodeVisits = node.data.statistics?.numVisits || 0;
    const rootVisits = root.data.statistics?.numVisits || 0;
    
    if (rootVisits === 0) return 0;
    
    return (nodeVisits / rootVisits) * 100;
};

export const calculateNodeCount = (tree) => {
    if (!tree) return 0;
    
    let count = 1;
    
    if (tree.children && Array.isArray(tree.children)) {
        count += tree.children.reduce((sum, child) => sum + calculateNodeCount(child), 0);
    }
    
    return count;
};

export const ensureNodeStatistics = (node) => {
    if (!node) return;
    
    if (!node.statistics) {
        node.statistics = { numVisits: 0, relativeVisits: 0, statisticsForActions: [] };
    } else if (typeof node.statistics.numVisits !== 'number') {
        node.statistics.numVisits = 0;
    }
    
    if (typeof node.statistics.relativeVisits !== 'number') {
        node.statistics.relativeVisits = 0;
    }
    
    if (!Array.isArray(node.statistics.statisticsForActions)) {
        node.statistics.statisticsForActions = [];
    }
    
    if (node.children && Array.isArray(node.children)) {
        node.children.forEach(ensureNodeStatistics);
    }
};