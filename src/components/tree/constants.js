// components/tree/constants.js
export const TREE_CONSTANTS = {
    MAX_VISIBLE_NODES: 100,
    DIMENSIONS: {
        WIDTH: 1500,
        HEIGHT: 1500,
        MARGIN: 50,
        PADDING: 200
    },
    COLORS: {
        STROKE: {
            NORMAL: '#2c5282',
            HAS_HIDDEN: '#ef4444',     // Узел, дети которого скрыты
            DEPTH_LIMITED: '#eab308'   // Узел скрыт из-за ограничения глубины
        },
        LINK: '#cbd5e0'
    },
    NODE_STATES: {
        VISIBLE: 'visible',
        HAS_HIDDEN_CHILDREN: 'has_hidden_children',
        PARENT_HIDDEN: 'parent_hidden',
        DEPTH_LIMITED: 'depth_limited'
    },
    STYLE: {
        STROKE_WIDTH: {
            NORMAL: 1.5,
            HAS_HIDDEN: 2.5
        }
    }
};