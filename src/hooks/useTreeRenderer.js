// src/hooks/useTreeRenderer.js
import { useCallback, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TREE_CONSTANTS } from '../components/tree/constants';
import { getNodeChangeStyle, getNodeRadius, applyNodeStyles } from '../utils/nodeRenderUtils';
import { createTreeLayout, determineTreeSize, applyCustomPositions, renderLinks } from '../utils/treeLayoutUtils';
import { createSvgFilters, addNodeCircles, addPercentageLabels, addPlusSignsToNodesWithHiddenChildren, 
         addChangeIndicators, animateNewNodes, addInteractionHandlers } from '../utils/nodeVisualUtils';
import { prepareHierarchyData, processVisibleNodes, createVisibleLinks } from '../utils/treeDataProcessor';

export const useTreeRenderer = ({
    data,
    onError,
    shouldShowNode,
    getNodeState,
    hiddenChildrenIds,
    filteredChildrenIds,
    overrideFilterIds,
    toggleNodeExpansion,
    toggleFilterOverride,
    handleContextMenu,
    setupNodeDrag,
    setupGraphPan,
    calculateNodePercentage,
    customNodePositions,
    changes,
    highlightChanges
}) => {
    const svgRef = useRef(null);
    const mainGroupRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalNodes: 0,
        visibleNodes: 0,
        maxDepth: 0
    });

    const renderTree = useCallback(() => {
        if (!data || !svgRef.current) return;
        setIsLoading(true);
    
        try {
            // Clear the SVG
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();
            
            svg.attr('width', TREE_CONSTANTS.DIMENSIONS.WIDTH)
               .attr('height', TREE_CONSTANTS.DIMENSIONS.HEIGHT);
    
            // Process data and determine tree size characteristics
            const { hierarchy, allNodes } = prepareHierarchyData(data);
            if (!hierarchy) throw new Error("Failed to process hierarchy data");
            
            const { 
                nodeCount, maxDepth, isTinyTree, isSmallTree,
                verticalSpacingMultiplier, nodeSpacingMultiplier 
            } = determineTreeSize(data);
            
            // Create tree layout and process positions
            const treeLayout = createTreeLayout(
                data, 
                verticalSpacingMultiplier, 
                nodeSpacingMultiplier, 
                isTinyTree, 
                isSmallTree
            );
            
            // Apply layout and then custom positions
            const root = treeLayout(hierarchy);
            applyCustomPositions(allNodes, customNodePositions);
            
            // Add SVG filters for animations
            createSvgFilters(svg);
            
            // Process visible nodes and links
            const { visibleNodes } = processVisibleNodes(root, shouldShowNode, getNodeState);
            const visibleLinks = createVisibleLinks(visibleNodes);
            
            // Create main group for the graph
            const g = svg.append('g')
                .attr('transform', `translate(${TREE_CONSTANTS.DIMENSIONS.MARGIN}, ${TREE_CONSTANTS.DIMENSIONS.MARGIN})`);
            
            mainGroupRef.current = g;
            setupGraphPan(svg, g, nodeCount);
    
            // Render links
            renderLinks(g, visibleLinks);
    
            // Prepare drag handler
            const dragHandler = setupNodeDrag();
    
            // Find root node visits for scaling
            const rootNode = allNodes.find(node => node.depth === 0);
            const rootVisits = rootNode?.data.statistics?.numVisits || 1;
            
            // Calculate node radius function
            const getNodeRadiusFunc = node => getNodeRadius(node, nodeCount, rootVisits);
            
            // Create node groups
            const nodeGroups = g.selectAll('g.node')
                .data(visibleNodes)
                .join('g')
                .attr('class', 'node')
                .attr('data-id', d => d.data.id)
                .attr('transform', d => `translate(${d.y},${d.x})`);
            
            // Add visual elements to nodes
            addNodeCircles(
                nodeGroups, 
                getNodeRadiusFunc, 
                getNodeState, 
                (node) => getNodeChangeStyle(node, changes, highlightChanges),
                applyNodeStyles,
                changes, 
                highlightChanges
            );
            
            addPercentageLabels(
                nodeGroups, 
                calculateNodePercentage, 
                isTinyTree, 
                isSmallTree, 
                getNodeRadiusFunc
            );
            
            addPlusSignsToNodesWithHiddenChildren(
                nodeGroups, 
                isTinyTree, 
                isSmallTree, 
                hiddenChildrenIds, 
                filteredChildrenIds, 
                overrideFilterIds
            );
            
            addChangeIndicators(nodeGroups, changes, isTinyTree);
            
            // Add interaction handlers
            addInteractionHandlers(
                nodeGroups,
                dragHandler,
                handleContextMenu,
                getNodeState,
                toggleNodeExpansion,
                toggleFilterOverride,
                hiddenChildrenIds,
                filteredChildrenIds,
                getNodeRadiusFunc
            );
            
            // Add animations for new nodes
            if (highlightChanges && changes && changes.newNodes && changes.newNodes.length > 0) {
                animateNewNodes(nodeGroups, changes);
            }
    
            // Update statistics
            setStats({
                totalNodes: allNodes.length,
                visibleNodes: visibleNodes.length,
                maxDepth: maxDepth
            });
            
            setError(null);
        } catch (err) {
            console.error('Error rendering tree:', err);
            setError(err.message);
            if (onError) onError(err);
        } finally {
            setIsLoading(false);
        }
    }, [
        data,
        setupNodeDrag,
        setupGraphPan,
        handleContextMenu,
        shouldShowNode,
        getNodeState,
        onError,
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds,
        toggleNodeExpansion,
        toggleFilterOverride,
        calculateNodePercentage,
        customNodePositions,
        changes,
        highlightChanges
    ]);

    // Run rendering when dependencies change
    useEffect(() => {
        renderTree();
    }, [
        renderTree, 
        data, 
        hiddenChildrenIds, 
        overrideFilterIds, 
        filteredChildrenIds,
        changes,
        highlightChanges
    ]);

    return {
        svgRef,
        renderTree,
        isLoading,
        error,
        stats
    };
};