// src/hooks/useGraphInteraction.js
import { useCallback } from 'react';
import * as d3 from 'd3';

export const useGraphInteraction = () => {
    const updateSubtreeAndLinks = useCallback((svg, node, dx, dy) => {
        const nodeData = node.__data__;
        
        // Находим все узлы поддерева
        const descendants = svg.selectAll('.node')
            .filter(d => {
                if (d === nodeData) return false;
                let current = d;
                while (current.parent) {
                    if (current.parent === nodeData) return true;
                    current = current.parent;
                }
                return false;
            });

        // Перемещаем узлы поддерева
        descendants.each(function() {
            const transform = d3.select(this).attr('transform');
            const [x, y] = transform.match(/translate\(([\d.-]+),([\d.-]+)\)/).slice(1).map(Number);
            d3.select(this).attr('transform', `translate(${x + dx},${y + dy})`);
        });

        // Обновляем связи для поддерева и перемещаемого узла
        svg.selectAll('path.link')
            .filter(d => d.source === nodeData || 
                        d.target === nodeData || 
                        descendants.data().some(desc => d.source === desc || d.target === desc))
            .attr('d', d3.linkHorizontal()
                .x(d => {
                    const node = svg.select(`.node[data-id="${d.data.id}"]`);
                    const transform = node.attr('transform');
                    return transform ? parseFloat(transform.match(/translate\(([\d.-]+)/)[1]) : 0;
                })
                .y(d => {
                    const node = svg.select(`.node[data-id="${d.data.id}"]`);
                    const transform = node.attr('transform');
                    return transform ? parseFloat(transform.match(/,([\d.-]+)\)/)[1]) : 0;
                })
            );
    }, []);

    const setupNodeDrag = useCallback((node) => {
        return d3.drag()
            .on('start', function(event) {
                d3.select(this).raise().classed('active', true);
            })
            .on('drag', function(event) {
                const selection = d3.select(this.parentNode);
                const transform = selection.attr('transform');
                const [x, y] = transform.match(/translate\(([\d.-]+),([\d.-]+)\)/).slice(1).map(Number);
                
                // Обновляем позицию текущего узла
                selection.attr('transform', `translate(${x + event.dx},${y + event.dy})`);
                
                // Обновляем поддерево и связи
                const svg = d3.select(this.closest('svg'));
                updateSubtreeAndLinks(svg, this, event.dx, event.dy);
            })
            .on('end', function() {
                d3.select(this).classed('active', false);
            });
    }, [updateSubtreeAndLinks]);

    const setupGraphPan = useCallback((svg, mainGroup) => {
        const zoom = d3.zoom()
            .scaleExtent([0.1, 4])
            .on('zoom', (event) => {
                mainGroup.attr('transform', event.transform);
            });

        svg.call(zoom);
    }, []);

    return { setupNodeDrag, setupGraphPan };
};