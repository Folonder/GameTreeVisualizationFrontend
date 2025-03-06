// src/components/tree/TreeNode.js
import React from 'react';
import * as d3 from 'd3';
import { TREE_CONSTANTS } from './constants';

const getNodeStyle = (nodeState, data) => {
    const baseStyle = {
        cursor: 'pointer',
        strokeWidth: nodeState === 'hidden' ? 2 : 1.5
    };

    switch (nodeState) {
        case 'hidden':
            return { ...baseStyle, stroke: TREE_CONSTANTS.COLORS.NODE_HIDDEN };
        case 'limited':
            return { ...baseStyle, stroke: TREE_CONSTANTS.COLORS.NODE_LIMITED };
        case TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN:
            return { ...baseStyle, stroke: TREE_CONSTANTS.COLORS.STROKE.HAS_HIDDEN, strokeWidth: 2.5 };
        default:
            return { ...baseStyle, stroke: TREE_CONSTANTS.COLORS.NODE_NORMAL };
    }
};

const TreeNode = ({ 
    node, 
    nodeState, 
    onContextMenu, 
    onShowChildren,
    setupNodeDrag 
}) => {
    const data = node.data;
    const style = getNodeStyle(nodeState, data);
    const visits = data.statistics?.numVisits || 0;
    
    // Проверяем, скрыты ли дети узла
    const hasHiddenChildren = nodeState === TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN;
    
    return (
        <g className="node">
            <circle
                r={Math.max(5, Math.sqrt(visits) / 2)}
                style={{
                    ...style,
                    fill: d3.interpolateBlues(Math.min(0.1 + visits / 1000, 0.9))
                }}
                onContextMenu={(e) => onContextMenu(e, node)}
                onClick={(e) => hasHiddenChildren && onShowChildren(e, node)}
                ref={node => node && setupNodeDrag(node)}
            />
            
            <text
                dy={-10}
                textAnchor="middle"
                style={{
                    fontSize: '10px',
                    fill: '#4a5568'
                }}
            >
                {Math.round(data.statistics?.relativeVisits || 0)}%
            </text>

            {hasHiddenChildren && (
                <text
                    dx={-3}
                    dy={4}
                    style={{
                        fontSize: '14px',
                        fontWeight: 'bold',
                        fill: style.stroke,
                        cursor: 'pointer'
                    }}
                    onClick={(e) => onShowChildren(e, node)}
                >
                    +
                </text>
            )}
        </g>
    );
};

export default React.memo(TreeNode);