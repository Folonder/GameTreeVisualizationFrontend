import * as d3 from 'd3';
import { TREE_CONSTANTS } from './constants';

/**
 * Возвращает стили для узла в зависимости от его состояния
 */
export const getNodeStyle = (nodeState, visits) => {
    // Базовые стили для всех узлов
    const baseStyle = {
        cursor: 'pointer',
        fill: d3.interpolateBlues(Math.min(0.1 + visits / 1000, 0.9))
    };

    // Специфичные стили в зависимости от состояния
    switch (nodeState) {
        case TREE_CONSTANTS.NODE_STATES.EXPANDED:
            return {
                ...baseStyle,
                stroke: TREE_CONSTANTS.COLORS.STROKE.EXPANDED, // Зеленый для узлов с видимыми детьми
                strokeWidth: TREE_CONSTANTS.STYLE.STROKE_WIDTH.HIGHLIGHTED
            };
        case TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN:
            return {
                ...baseStyle,
                stroke: TREE_CONSTANTS.COLORS.STROKE.HAS_HIDDEN, // Красный для узлов со скрытыми детьми
                strokeWidth: TREE_CONSTANTS.STYLE.STROKE_WIDTH.HIGHLIGHTED
            };
        case TREE_CONSTANTS.NODE_STATES.DEPTH_LIMITED:
            return {
                ...baseStyle,
                stroke: TREE_CONSTANTS.COLORS.STROKE.DEPTH_LIMITED,
                strokeWidth: TREE_CONSTANTS.STYLE.STROKE_WIDTH.NORMAL,
                opacity: TREE_CONSTANTS.STYLE.NODE_OPACITY.DIMMED
            };
        case TREE_CONSTANTS.NODE_STATES.FILTERED:
            return {
                ...baseStyle,
                stroke: TREE_CONSTANTS.COLORS.STROKE.FILTERED,
                strokeWidth: TREE_CONSTANTS.STYLE.STROKE_WIDTH.NORMAL,
                opacity: TREE_CONSTANTS.STYLE.NODE_OPACITY.DIMMED
            };
        default:
            return {
                ...baseStyle,
                stroke: TREE_CONSTANTS.COLORS.STROKE.NORMAL,
                strokeWidth: TREE_CONSTANTS.STYLE.STROKE_WIDTH.NORMAL
            };
    }
};

/**
 * Возвращает описание состояния узла в виде текста для отображения в интерфейсе
 */
export const getNodeStateDescription = (nodeState) => {
    switch (nodeState) {
        case TREE_CONSTANTS.NODE_STATES.EXPANDED:
            return 'Развернутый узел с видимыми потомками';
        case TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN:
            return 'Узел со скрытыми потомками';
        case TREE_CONSTANTS.NODE_STATES.DEPTH_LIMITED:
            return 'Узел скрыт из-за ограничения глубины';
        case TREE_CONSTANTS.NODE_STATES.FILTERED:
            return 'Узел скрыт из-за критериев фильтрации';
        case TREE_CONSTANTS.NODE_STATES.PARENT_HIDDEN:
            return 'Узел скрыт, так как скрыт родительский узел';
        case TREE_CONSTANTS.NODE_STATES.VISIBLE:
            return 'Видимый узел';
        default:
            return 'Неизвестное состояние';
    }
};