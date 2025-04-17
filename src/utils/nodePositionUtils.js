// src/utils/nodePositionUtils.js
import * as d3 from 'd3';
import { getNodeIdentifier } from './treeUtils';

export const setupNodeDrag = (onNodeDragEnd) => {
    const dragHandler = d3.drag()
        .on('start', function(event, d) {
            event.sourceEvent.stopPropagation();
            if (this && this.parentNode) {
                d3.select(this.parentNode).raise().classed('dragging', true);
            }
        })
        .on('drag', function(event, d) {
            if (!this || !this.parentNode) return;
            
            const svg = d3.select(this.ownerSVGElement);
            if (!svg.node()) return;
            
            const group = d3.select(this.parentNode);
            if (!group.node()) return;
            
            const transform = group.attr('transform');
            if (!transform) return;
            
            const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
            if (!translate) return;
            
            const x = parseFloat(translate[1]);
            const y = parseFloat(translate[2]);
            
            group.attr('transform', `translate(${x + event.dx},${y + event.dy})`);
            group.attr('data-drag-x', x + event.dx);
            group.attr('data-drag-y', y + event.dy);
            
            updateDescendants(svg, d, event.dx, event.dy);
            updateLinks(svg, d);
        })
        .on('end', function(event, d) {
            if (!this || !this.parentNode) return;
            
            const parent = d3.select(this.parentNode);
            parent.classed('dragging', false);
            
            const finalX = parseFloat(parent.attr('data-drag-x'));
            const finalY = parseFloat(parent.attr('data-drag-y'));
            
            if (isNaN(finalX) || isNaN(finalY)) {
                return;
            }
            
            const nodeId = getNodeIdentifier(d);
            
            saveNodePosition(nodeId, finalX, finalY, d.y, d.x, onNodeDragEnd);
            
            const svg = d3.select(this.ownerSVGElement);
            if (!svg.node()) return;
            
            saveDescendantPositions(svg, d, onNodeDragEnd);
        });
    
    return dragHandler;
};

function updateDescendants(svg, parentNode, dx, dy) {
    try {
        const descendants = svg.selectAll('.node')
            .filter(function() {
                try {
                    const thisData = d3.select(this).datum();
                    if (!thisData || !thisData.parent) return false;
                    
                    let current = thisData;
                    while (current.parent) {
                        if (current.parent === parentNode) return true;
                        current = current.parent;
                    }
                    return false;
                } catch (e) {
                    return false;
                }
            });
        
        descendants.each(function() {
            try {
                const g = d3.select(this);
                const currentTransform = g.attr('transform');
                if (!currentTransform) return;
                
                const currentTranslate = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
                if (!currentTranslate) return;
                
                const currentX = parseFloat(currentTranslate[1]);
                const currentY = parseFloat(currentTranslate[2]);
                
                g.attr('transform', `translate(${currentX + dx},${currentY + dy})`);
                g.attr('data-drag-x', currentX + dx);
                g.attr('data-drag-y', currentY + dy);
            } catch (e) {
                console.error('Error updating descendant position:', e);
            }
        });
    } catch (e) {
        console.error('Error during descendants update:', e);
    }
}

function updateLinks(svg, draggedNode) {
    svg.selectAll('path.link').each(function(link) {
        try {
            const linkData = d3.select(this).datum();
            if (!linkData || !linkData.source || !linkData.target) return;
            
            const isLinkAffected = isNodeOrDescendant(linkData.source, draggedNode) || 
                                isNodeOrDescendant(linkData.target, draggedNode);
            
            if (isLinkAffected) {
                d3.select(this).attr('d', d3.linkHorizontal()
                    .x(p => getNodeX(svg, p))
                    .y(p => getNodeY(svg, p))
                );
            }
        } catch (e) {
            console.error('Error updating link:', e);
        }
    });
}

function isNodeOrDescendant(node, targetNode) {
    if (node === targetNode) return true;
    
    let current = node;
    while (current.parent) {
        if (current.parent === targetNode) return true;
        current = current.parent;
    }
    
    return false;
}

function getNodeX(svg, node) {
    const selector = `.node[data-id="${node.data.id}"]`;
    const nodeElement = svg.select(selector);
    
    if (!nodeElement.node()) return node.y;
    
    const transform = nodeElement.attr('transform');
    if (!transform) return node.y;
    
    const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
    return translate ? parseFloat(translate[1]) : node.y;
}

function getNodeY(svg, node) {
    const selector = `.node[data-id="${node.data.id}"]`;
    const nodeElement = svg.select(selector);
    
    if (!nodeElement.node()) return node.x;
    
    const transform = nodeElement.attr('transform');
    if (!transform) return node.x;
    
    const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
    return translate ? parseFloat(translate[2]) : node.x;
}

function saveNodePosition(nodeId, x, y, originalX, originalY, onNodeDragEnd) {
    onNodeDragEnd(nodeId, { 
        x, 
        y,
        originalX,
        originalY 
    });
}

function saveDescendantPositions(svg, parentNode, onNodeDragEnd) {
    const descendants = svg.selectAll('.node')
        .filter(function() {
            try {
                const thisData = d3.select(this).datum();
                if (!thisData || !thisData.parent) return false;
                
                let current = thisData;
                while (current.parent) {
                    if (current.parent === parentNode) return true;
                    current = current.parent;
                }
                return false;
            } catch (e) {
                return false;
            }
        });
    
    descendants.each(function() {
        try {
            const g = d3.select(this);
            const childData = g.datum();
            const childId = getNodeIdentifier(childData);
            
            const finalChildX = parseFloat(g.attr('data-drag-x'));
            const finalChildY = parseFloat(g.attr('data-drag-y'));
            
            if (isNaN(finalChildX) || isNaN(finalChildY)) {
                return;
            }
            
            saveNodePosition(
                childId, 
                finalChildX, 
                finalChildY, 
                childData.y, 
                childData.x,
                onNodeDragEnd
            );
        } catch (e) {
            console.error('Error saving descendant position:', e);
        }
    });
}