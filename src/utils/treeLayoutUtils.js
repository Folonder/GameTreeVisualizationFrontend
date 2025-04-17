// src/utils/treeLayoutUtils.js
import * as d3 from 'd3';
import { TREE_CONSTANTS } from '../components/tree/constants';

export function createTreeLayout(data, verticalSpacingMultiplier, nodeSpacingMultiplier, isTinyTree, isSmallTree) {
    return d3.tree()
        .size([
            (TREE_CONSTANTS.DIMENSIONS.HEIGHT - TREE_CONSTANTS.DIMENSIONS.PADDING) * verticalSpacingMultiplier,
            TREE_CONSTANTS.DIMENSIONS.WIDTH - TREE_CONSTANTS.DIMENSIONS.PADDING
        ])
        .separation((a, b) => {
            const baseDistance = a.parent === b.parent 
                ? TREE_CONSTANTS.LAYOUT.SEPARATION.SIBLINGS * nodeSpacingMultiplier
                : TREE_CONSTANTS.LAYOUT.SEPARATION.NON_SIBLINGS * nodeSpacingMultiplier;
            
            if (isTinyTree) {
                return baseDistance * TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.SPACING;
            } else if (isSmallTree) {
                return baseDistance * TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.SPACING;
            }

            const sizeAdjustment = Math.max(
                Math.sqrt(a.data.statistics?.numVisits || 0),
                Math.sqrt(b.data.statistics?.numVisits || 0)
            ) / 40;

            return baseDistance + sizeAdjustment;
        });
}

export function determineTreeSize(data) {
    const hierarchy = d3.hierarchy(data);
    const allNodes = hierarchy.descendants();
    
    const nodeCount = allNodes.length;
    const maxDepth = Math.max(...allNodes.map(d => d.depth), 0);
    
    const isTinyTree = nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.NODE_COUNT || 
                      maxDepth < TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.DEPTH;
                      
    const isSmallTree = nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT || 
                       maxDepth < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.DEPTH;
    
    const verticalSpacingMultiplier = isTinyTree ? 0.6 : isSmallTree ? 0.8 : 2.5;
    const nodeSpacingMultiplier = isTinyTree ? 1.2 : isSmallTree ? 1.5 : 1.5;
    
    return {
        hierarchy,
        allNodes,
        nodeCount,
        maxDepth,
        isTinyTree,
        isSmallTree,
        verticalSpacingMultiplier,
        nodeSpacingMultiplier
    };
}

export function applyCustomPositions(allNodes, customNodePositions) {
    if (!customNodePositions || !allNodes) return;
    
    allNodes.forEach(node => {
        if (!node || !node.data) return;
        
        const nodeId = node.data.id;
        if (!nodeId) return;
        
        const customPosition = customNodePositions.get(nodeId);
        if (customPosition) {
            node.x = customPosition.y;
            node.y = customPosition.x;
        }
    });
}

export function renderLinks(container, visibleLinks) {
    return container.selectAll('path.link')
        .data(visibleLinks)
        .join('path')
        .attr('class', 'link')
        .attr('fill', 'none')
        .attr('stroke', TREE_CONSTANTS.COLORS.LINK)
        .attr('stroke-width', TREE_CONSTANTS.STYLE.STROKE_WIDTH.LINK)
        .attr('stroke-opacity', TREE_CONSTANTS.STYLE.LINK_OPACITY)
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x));
}