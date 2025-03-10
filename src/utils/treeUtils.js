// src/utils/treeUtils.js
/**
 * Utility functions for tree operations and calculations
 */

/**
 * Generates a unique ID for a node based on its state and position in the tree
 * @param {Object} node - The node object from d3.hierarchy
 * @returns {String} A unique identifier string
 */
export const getNodeIdentifier = (node) => {
    // If the node has a predefined ID, use it
    if (node.data.id) return node.data.id;
    
    // Create a unique ID based on the node's state and position in the tree
    const pathParts = [];
    let current = node;
    
    // Build a path from the root to the node
    while (current) {
        let nodePart = '';
        
        // Add the index among parent's children, if possible
        if (current.parent && current.parent.children) {
            const index = current.parent.children.indexOf(current);
            nodePart = `${index}-`;
        }
        
        // Add part of the node's state or depth
        nodePart += current.data.state 
            ? `${current.data.state.slice(0, 20).replace(/\s+/g, '')}`
            : `depth-${current.depth}`;
        
        pathParts.unshift(nodePart);
        current = current.parent;
    }
    
    // Combine the path parts into a unique ID
    return `node-${pathParts.join('-')}`;
};

/**
 * Находит корневой узел дерева
 * @param {Object} node - Любой узел дерева
 * @returns {Object} Корневой узел
 */
export const findRootNode = (node) => {
    let root = node;
    while (root.parent) {
        root = root.parent;
    }
    return root;
};

/**
 * Calculates the percentage of visits for a node relative to its siblings
 * @param {Object} node - The node object from d3.hierarchy
 * @returns {Number} The percentage value (0-100)
 */
export const calculateNodePercentage = (node) => {
    // If this is the root node, it's 100%
    if (!node.parent) return 100;
    
    // Get this node's number of visits
    const visits = node.data.statistics?.numVisits || 0;
    
    // For siblings, we need to calculate total visits at this level
    let totalVisits = 0;
    
    // If node has a parent and parent has children
    if (node.parent && node.parent.children) {
        // Sum visits for all siblings (nodes at the same level with the same parent)
        totalVisits = node.parent.children.reduce((sum, child) => 
            sum + (child.data.statistics?.numVisits || 0), 0);
    }
    
    // Calculate percentage of this node's visits compared to total visits at this level
    return totalVisits > 0 ? (visits / totalVisits * 100) : 0;
};

/**
 * Calculates the percentage of visits for a node relative to the root node
 * @param {Object} node - The node object from d3.hierarchy
 * @returns {Number} The percentage value (0-100)
 */
export const calculateNodePercentageFromRoot = (node) => {
    // Найдем корневой узел
    const root = findRootNode(node);
    
    // Если передан сам корень, возвращаем 100%
    if (node === root) return 100;
    
    // Получаем количество посещений текущего узла и корня
    const nodeVisits = node.data.statistics?.numVisits || 0;
    const rootVisits = root.data.statistics?.numVisits || 0;
    
    // Если у корня нет посещений, возвращаем 0
    if (rootVisits === 0) return 0;
    
    // Возвращаем процент от корня
    return (nodeVisits / rootVisits) * 100;
};