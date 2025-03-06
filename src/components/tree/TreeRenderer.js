// src/components/tree/TreeRenderer.js
import { useCallback, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { getNodeIdentifier } from '../../utils/treeUtils';
import { TREE_CONSTANTS } from './constants';
import { getNodeStyle } from './NodeStyles';

/**
 * Component responsible for rendering the tree using D3
 */
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
    savedTransform,
    updateTransform // Новый параметр
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

    /**
     * Renders the tree visualization using D3
     */
    const renderTree = useCallback(() => {
        if (!data || !svgRef.current) return;
        setIsLoading(true);
    
        try {
            // Clear the SVG
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();
            
            svg.attr('width', TREE_CONSTANTS.DIMENSIONS.WIDTH)
               .attr('height', TREE_CONSTANTS.DIMENSIONS.HEIGHT);
    
            const hierarchy = d3.hierarchy(data);
            const treeLayout = d3.tree()
                .size([
                    // Увеличиваем вертикальное пространство для дерева в 2.5 раза
                    (TREE_CONSTANTS.DIMENSIONS.HEIGHT - TREE_CONSTANTS.DIMENSIONS.PADDING) * 2.5,
                    TREE_CONSTANTS.DIMENSIONS.WIDTH - TREE_CONSTANTS.DIMENSIONS.PADDING
                ])
                .separation((a, b) => {
                    // Увеличиваем базовое расстояние между узлами
                    const baseDistance = a.parent === b.parent 
                        ? TREE_CONSTANTS.LAYOUT.SEPARATION.SIBLINGS * 1.5
                        : TREE_CONSTANTS.LAYOUT.SEPARATION.NON_SIBLINGS * 1.5;
    
                    // Дополнительно учитываем размер узлов при определении расстояния
                    const sizeAdjustment = Math.max(
                        Math.sqrt(a.data.statistics?.numVisits || 0),
                        Math.sqrt(b.data.statistics?.numVisits || 0)
                    ) / 40;
    
                    return baseDistance + sizeAdjustment;
                });
    
            const root = treeLayout(hierarchy);
            const allNodes = root.descendants();
            
            // Add unique IDs for nodes
            allNodes.forEach(node => {
                if (!node.data.id) {
                    node.data.id = getNodeIdentifier(node);
                }
            });
            
            // Filter nodes using recursive visibility check
            const visibleNodes = [];
            const processNodeVisibility = (node, isParentVisible = true, depth = 0) => {
                // Определяем, должен ли этот узел быть видимым
                // Если это узел, дети которого скрыты, он всё равно должен быть виден
                const shouldShow = isParentVisible && 
                    (shouldShowNode(node) || hiddenChildrenIds.has(getNodeIdentifier(node)));
                
                // Если узел должен быть видимым, добавляем его в список
                if (shouldShow) {
                    visibleNodes.push(node);
                    
                    // Проверяем, должны ли дети этого узла быть скрыты
                    const nodeId = getNodeIdentifier(node);
                    const areChildrenHiddenManually = hiddenChildrenIds.has(nodeId);
                    const areChildrenFilteredOut = filteredChildrenIds.has(nodeId) && !overrideFilterIds.has(nodeId);
                    
                    // Рекурсивно обрабатываем детей только если их не нужно скрывать
                    if (!areChildrenHiddenManually && !areChildrenFilteredOut && node.children) {
                        node.children.forEach(child => {
                            // Важно: передаем depth + 1, чтобы контролировать глубину
                            processNodeVisibility(child, true, depth + 1);
                        });
                    }
                }
            };

            // Start with the root node
            processNodeVisibility(root, true, 0);
            
            // Determine state for all visible nodes
            const nodeStates = new Map();
            for (const node of visibleNodes) {
                nodeStates.set(node, getNodeState(node));
            }
            
            // Create links only between visible nodes
            const visibleLinks = [];
            for (const node of visibleNodes) {
                if (node.parent && visibleNodes.includes(node.parent)) {
                    visibleLinks.push({ source: node.parent, target: node });
                }
            }
    
            // Create group for the graph
            const g = svg.append('g')
                .attr('transform', `translate(${TREE_CONSTANTS.DIMENSIONS.MARGIN}, ${TREE_CONSTANTS.DIMENSIONS.MARGIN})`);
            
            mainGroupRef.current = g;
            setupGraphPan(svg, g);
    
            // Render links
            g.selectAll('path.link')
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
    
            // Create drag handler
            const dragHandler = setupNodeDrag();
    
            // Render nodes
            const nodeGroups = g.selectAll('g.node')
                .data(visibleNodes)
                .join('g')
                .attr('class', 'node')
                .attr('data-id', d => d.data.id)
                .attr('transform', d => `translate(${d.y},${d.x})`);
            
            // Add invisible larger circle for better dragging and context menu
            nodeGroups.append('circle')
                .attr('r', d => Math.max(
                    TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS + 10,
                    Math.min(
                        Math.sqrt(d.data.statistics?.numVisits || 0) / 2 + 10,
                        TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS + 10
                    )
                ))
                .style('fill', 'transparent')
                .style('stroke', 'none')
                .style('cursor', 'pointer')
                .on('contextmenu', (event, d) => handleContextMenu(event, d, nodeStates.get(d)))
                .on('click', (event, d) => {
                    const nodeId = getNodeIdentifier(d);
                    // If the node has hidden children (explicitly or through filters)
                    if (hiddenChildrenIds.has(nodeId)) {
                        toggleNodeExpansion(d);
                    } else if (filteredChildrenIds.has(nodeId)) {
                        toggleFilterOverride(d);
                    }
                })
                .call(dragHandler);
    
            // Add visible circles for nodes
            nodeGroups.append('circle')
                .attr('r', d => Math.max(
                    TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS,
                    Math.min(
                        Math.sqrt(d.data.statistics?.numVisits || 0) / 2,
                        TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS
                    )
                ))
                .each(function(d) {
                    const nodeState = nodeStates.get(d);
                    const visits = d.data.statistics?.numVisits || 0;
                    const style = getNodeStyle(nodeState, visits);
                    
                    Object.entries(style).forEach(([key, value]) => {
                        d3.select(this).style(key, value);
                    });
                })
                .style('pointer-events', 'none'); // Disable events so they're handled by the larger circle
    
                nodeGroups.append('rect')
    .attr('x', -16) // Половина ширины прямоугольника
    .attr('y', -TREE_CONSTANTS.DIMENSIONS.NODE.TEXT_OFFSET - 14) 
    .attr('width', 32) // Ширина прямоугольника
    .attr('height', 16) // Высота прямоугольника
    .attr('rx', 3) // Скругление углов
    .attr('ry', 3)
    .style('fill', 'rgba(0, 0, 0, 0.7)') // Полупрозрачный чёрный фон
    .style('stroke', 'rgba(255, 255, 255, 0.5)') // Тонкая белая рамка
    .style('stroke-width', '1px')
    .style('pointer-events', 'none');
            // Add percentage text
            nodeGroups.append('text')
    .attr('dy', -TREE_CONSTANTS.DIMENSIONS.NODE.TEXT_OFFSET - 5)
    .attr('text-anchor', 'middle')
    .style('font-size', '11px')
    .style('font-weight', 'bold')
    .style('fill', '#ffffff') // Белый текст на тёмном фоне
    .style('pointer-events', 'none')
    .text(d => {
        const percentage = calculateNodePercentage(d);
        return `${Math.round(percentage)}%`;
    });
                
            // Add "+" symbol for nodes with hidden children
            nodeGroups.filter(d => {
                const nodeId = getNodeIdentifier(d);
                return hiddenChildrenIds.has(nodeId) || 
                       (filteredChildrenIds.has(nodeId) && !overrideFilterIds.has(nodeId));
            }).append('text')
                .attr('dx', 0)
                .attr('dy', 5)
                .attr('text-anchor', 'middle')
                .style('font-size', '14px')
                .style('font-weight', 'bold')
                .style('pointer-events', 'none') // Disable events
                .text('+')
                .style('fill', d => {
                    const nodeId = getNodeIdentifier(d);
                    return hiddenChildrenIds.has(nodeId) ? 
                        TREE_CONSTANTS.COLORS.STROKE.HAS_HIDDEN : 
                        TREE_CONSTANTS.COLORS.STROKE.DEPTH_LIMITED;
                });
    
            // Update statistics
            setStats({
                totalNodes: allNodes.length,
                visibleNodes: visibleNodes.length,
                maxDepth: Math.max(...allNodes.map(d => d.depth))
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
        savedTransform,
        updateTransform // Добавьте в список зависимостей
    ]);

    // Run rendering when dependencies change
    useEffect(() => {
        renderTree();
    }, [
        renderTree, 
        data, 
        hiddenChildrenIds, 
        overrideFilterIds, 
        filteredChildrenIds
    ]);

    return {
        svgRef,
        renderTree,
        isLoading,
        error,
        stats
    };
};