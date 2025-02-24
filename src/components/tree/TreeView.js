// src/components/tree/TreeView.js
import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom';
import * as d3 from 'd3';
import Card from '../common/Card';
import { useGraphInteraction } from '../../hooks/useGraphInteraction';
import { useTreeFilters } from '../../hooks/useTreeFilters';
import DepthFilterControls from './DepthFilterControls';
import ContextMenu from './ContextMenu';
import TreeNode from './TreeNode';
import { TREE_CONSTANTS } from './constants';

const TreeView = ({ data }) => {
    const svgRef = useRef(null);
    const mainGroupRef = useRef(null);
    const { setupNodeDrag, setupGraphPan } = useGraphInteraction();
    const [depthFilters, setDepthFilters] = useState(new Map());
    const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, node: null });
    const [hiddenNodes, setHiddenNodes] = useState(new Set());
    const { filterNodes } = useTreeFilters(depthFilters, hiddenNodes);

    const handleHideChildren = useCallback(() => {
        if (contextMenu.node) {
            setHiddenNodes(prev => {
                const newHidden = new Set(prev);
                newHidden.add(contextMenu.node.data.id);
                return newHidden;
            });
        }
    }, [contextMenu.node]);

    const handleShowChildren = useCallback((event, node) => {
        event.stopPropagation();
        setHiddenNodes(prev => {
            const newHidden = new Set(prev);
            newHidden.delete(node.data.id);
            return newHidden;
        });
    }, []);

    const handleContextMenu = useCallback((event, node) => {
        event.preventDefault();
        event.stopPropagation();
        setContextMenu({
            visible: true,
            x: event.pageX,
            y: event.pageY,
            node
        });
    }, []);

    const renderTree = useCallback(() => {
        if (!data || !svgRef.current) return;

        const svg = d3.select(svgRef.current)
            .attr('width', TREE_CONSTANTS.DIMENSIONS.WIDTH)
            .attr('height', TREE_CONSTANTS.DIMENSIONS.HEIGHT);

        svg.selectAll("*").remove();

        const hierarchy = d3.hierarchy(data);
        const treeLayout = d3.tree()
            .size([
                TREE_CONSTANTS.DIMENSIONS.HEIGHT - TREE_CONSTANTS.DIMENSIONS.PADDING,
                TREE_CONSTANTS.DIMENSIONS.WIDTH - TREE_CONSTANTS.DIMENSIONS.PADDING
            ])
            .separation((a, b) => {
                const baseDistance = 5;
                const sizeAdjustment = Math.max(
                    Math.sqrt(a.data.statistics?.numVisits || 0),
                    Math.sqrt(b.data.statistics?.numVisits || 0)
                ) / 50;
                
                return a.parent === b.parent ? 
                    baseDistance + sizeAdjustment : 
                    baseDistance * 2 + sizeAdjustment;
            });

        const root = treeLayout(hierarchy);
        const { filteredNodes, nodeStates } = filterNodes(root.descendants());
        const filteredLinks = root.links().filter(link => 
            filteredNodes.includes(link.source) && filteredNodes.includes(link.target)
        );

        const g = svg.append('g')
            .attr('transform', `translate(${TREE_CONSTANTS.DIMENSIONS.MARGIN}, ${TREE_CONSTANTS.DIMENSIONS.MARGIN})`);
        
        mainGroupRef.current = g;
        setupGraphPan(svg, g);

        // Рисуем связи
        g.selectAll('path.link')
            .data(filteredLinks)
            .join('path')
            .attr('class', 'link')
            .attr('fill', 'none')
            .attr('stroke', TREE_CONSTANTS.COLORS.LINK)
            .attr('stroke-width', 1)
            .attr('stroke-opacity', 0.4)
            .attr('d', d3.linkHorizontal()
                .x(d => d.y)
                .y(d => d.x));

        // Рисуем узлы
        const nodes = g.selectAll('g.node')
            .data(filteredNodes)
            .join('g')
            .attr('class', 'node')
            .attr('data-id', d => d.data.id)
            .attr('transform', d => `translate(${d.y},${d.x})`);

        // Рисуем круги для узлов
        nodes.append('circle')
            .attr('r', d => Math.max(5, Math.sqrt(d.data.statistics?.numVisits || 0) / 2))
            .style('fill', d => {
                const visits = d.data.statistics?.numVisits || 0;
                return d3.interpolateBlues(Math.min(0.1 + visits / 1000, 0.9));
            })
            .style('stroke', d => {
                const nodeState = nodeStates.get(d);
                switch (nodeState) {
                    case 'hidden':
                        return TREE_CONSTANTS.COLORS.NODE_HIDDEN;
                    case 'limited':
                        return TREE_CONSTANTS.COLORS.NODE_LIMITED;
                    default:
                        return TREE_CONSTANTS.COLORS.NODE_NORMAL;
                }
            })
            .style('stroke-width', d => nodeStates.get(d) === 'hidden' ? 2 : 1.5)
            .style('cursor', 'pointer')
            .on('contextmenu', handleContextMenu)
            .each(function(d) {
                d3.select(this).call(setupNodeDrag);
            });

        // Добавляем текст с процентами
        nodes.append('text')
            .attr('dy', -10)
            .attr('text-anchor', 'middle')
            .style('font-size', '10px')
            .style('fill', '#4a5568')
            .text(d => `${Math.round(d.data.statistics?.relativeVisits || 0)}%`);

        // Добавляем маркер скрытых узлов
        nodes.filter(d => nodeStates.get(d) !== 'visible')
            .append('text')
            .attr('dx', -3)
            .attr('dy', 4)
            .style('font-size', '14px')
            .style('font-weight', 'bold')
            .style('fill', d => {
                const nodeState = nodeStates.get(d);
                switch (nodeState) {
                    case 'hidden':
                        return TREE_CONSTANTS.COLORS.NODE_HIDDEN;
                    case 'limited':
                        return TREE_CONSTANTS.COLORS.NODE_LIMITED;
                    default:
                        return TREE_CONSTANTS.COLORS.NODE_NORMAL;
                }
            })
            .style('cursor', 'pointer')
            .text('+')
            .on('click', handleShowChildren);

    }, [data, filterNodes, setupNodeDrag, setupGraphPan, handleContextMenu, handleShowChildren]);

    useEffect(() => {
        renderTree();
    }, [renderTree]);

    const maxDepth = data ? Math.max(...d3.hierarchy(data).descendants().map(d => d.depth)) : 0;

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <DepthFilterControls
                    maxDepth={maxDepth}
                    onFiltersChange={setDepthFilters}
                />
            </div>
            <Card>
                <div className="relative">
                    <svg 
                        ref={svgRef} 
                        className="w-full"
                        style={{ 
                            background: 'white',
                            minHeight: TREE_CONSTANTS.DIMENSIONS.HEIGHT
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                    />
                    {contextMenu.visible && (
                        <ContextMenu
                            x={contextMenu.x}
                            y={contextMenu.y}
                            node={contextMenu.node}
                            onClose={() => setContextMenu({ visible: false, x: 0, y: 0, node: null })}
                            onHideChildren={handleHideChildren}
                            onShowChildren={(node) => handleShowChildren({ stopPropagation: () => {} }, node)}
                            isHidden={hiddenNodes.has(contextMenu.node?.data?.id)}
                        />
                    )}
                </div>
            </Card>
        </div>
    );
};

export default React.memo(TreeView);