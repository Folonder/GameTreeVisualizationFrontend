// src/utils/nodeRenderUtils.js
import { TREE_CONSTANTS } from '../components/tree/constants';
import { getNodeStyle } from '../components/tree/NodeStyles';
import { getNodeIdentifier } from './treeUtils';

// ЭКСПОРТИРУЕМ функцию getNodeRadius
export const getNodeRadius = (node, nodeCount, totalRootVisits = 100) => {
    const visits = node.data.statistics?.numVisits || 0;
    
    const isTinyTree = nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.NODE_COUNT;
    const isSmallTree = nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT;
    
    const baseMaxRadius = isTinyTree 
        ? TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS * 2
        : isSmallTree 
            ? TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS * 1.5
            : TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS;
            
    const baseMinRadius = isTinyTree 
        ? TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS * 1.2
        : isSmallTree 
            ? TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS * 1.1
            : TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS;
    
    if (totalRootVisits < TREE_CONSTANTS.ADAPTIVE_SCALING.VISITS_THRESHOLD.INITIAL_LARGE) {
        return baseMaxRadius * 0.8;
    }
    
    const visitRatio = visits / totalRootVisits;
    const radius = baseMinRadius + (baseMaxRadius - baseMinRadius) * visitRatio;
    
    return radius;
};

// ЭКСПОРТИРУЕМ функцию getNodeChangeStyle
export const getNodeChangeStyle = (node, changes, highlightChanges) => {
    if (!highlightChanges || !changes) return {};
    
    const nodeId = node.data.id || getNodeIdentifier(node);
    const isPlayout = node.data?.isPlayout || false;
    
    // Проверяем, является ли узел новым
    const isNewNode = changes.newNodes && changes.newNodes.includes(nodeId);
    
    // Проверяем, был ли узел обновлен
    const updatedNode = changes.updatedNodes && 
        changes.updatedNodes.find(n => n.id === nodeId);
    
    // КОМБИНИРОВАННЫЕ СТИЛИ: Новый + Playout
    if (isNewNode && isPlayout) {
        return {
            // Зеленая граница (новый) с фиолетовым внутренним контуром (playout)
            stroke: '#4caf50',                    // Основная зеленая граница (новый)
            strokeWidth: 6,                       // Толстая граница
            fill: 'url(#newPlayoutGradient)',     // Градиент зелено-фиолетовый
            strokeDasharray: '5,3',               // Пунктир для playout
            strokeOpacity: 1,
            // Добавляем тень для дополнительного выделения
            filter: 'drop-shadow(0px 0px 4px rgba(147, 51, 234, 0.5)) drop-shadow(0px 0px 2px rgba(76, 175, 80, 0.8))'
        };
    }
    
    // КОМБИНИРОВАННЫЕ СТИЛИ: Обновленный + Playout  
    if (updatedNode && isPlayout) {
        const changeRatio = Math.min(1, updatedNode.change / 20);
        return {
            // Синяя граница (обновленный) с фиолетовым паттерном (playout)
            stroke: '#2196f3',                    // Основная синяя граница (обновленный)
            strokeWidth: 3 + 3 * changeRatio,    // Толщина зависит от изменений
            fill: 'url(#updatedPlayoutGradient)', // Градиент сине-фиолетовый
            strokeDasharray: '8,4,2,4',           // Сложный паттерн для комбинации
            strokeOpacity: 1,
            filter: 'drop-shadow(0px 0px 3px rgba(147, 51, 234, 0.4)) drop-shadow(0px 0px 2px rgba(33, 150, 243, 0.6))'
        };
    }
    
    // Только новый узел (существующий код)
    if (isNewNode) {
        return {
            stroke: '#4caf50',    
            strokeWidth: 4,       
            fill: '#b9f6ca',      
            fillOpacity: 0.8,     
            strokeOpacity: 1
        };
    }
    
    // Только обновленный узел (существующий код)
    if (updatedNode) {
        const changeRatio = Math.min(1, updatedNode.change / 20);
        return {
            stroke: '#2196f3',   
            strokeWidth: 2 + 2 * changeRatio,
            strokeDasharray: updatedNode.change > 10 ? '5,2' : '',
            fill: '#bbdefb',     
            fillOpacity: 0.6 + 0.4 * changeRatio,   
            strokeOpacity: 1
        };
    }
    
    return {};
};

// ЭКСПОРТИРУЕМ функцию applyNodeStyles
export const applyNodeStyles = (node, nodeState, visits, changeStyle = {}) => {
    const isPlayout = node.datum()?.data?.isPlayout || false;
    
    // Если есть стили изменений (новый/обновленный), они имеют приоритет
    if (Object.keys(changeStyle).length > 0) {
        // Применяем стили изменений (которые уже учитывают playout если нужно)
        Object.entries(changeStyle).forEach(([key, value]) => {
            node.style(key, value);
        });
    } else {
        // Применяем обычные стили с учетом playout
        const baseStyle = getNodeStyle(nodeState, visits, isPlayout);
        Object.entries(baseStyle).forEach(([key, value]) => {
            node.style(key, value);
        });
    }
};