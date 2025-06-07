// src/utils/nodeVisualUtils.js
import * as d3 from 'd3';
import { getNodeIdentifier } from './treeUtils';
import { TREE_CONSTANTS } from '../components/tree/constants';

// src/utils/nodeVisualUtils.js - обновить функцию createSvgFilters

export function createSvgFilters(svg) {
    const defs = svg.append('defs');
    
    // Существующие фильтры свечения...
    const newNodeFilter = defs.append('filter')
        .attr('id', 'glow-new-node')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
    
    const newNodeGlow = newNodeFilter.append('feGaussianBlur')
        .attr('stdDeviation', '2')
        .attr('result', 'coloredBlur');
    
    const newNodeMerge = newNodeFilter.append('feMerge');
    newNodeMerge.append('feMergeNode').attr('in', 'coloredBlur');
    newNodeMerge.append('feMergeNode').attr('in', 'SourceGraphic');
    
    const updatedNodeFilter = defs.append('filter')
        .attr('id', 'pulse-updated-node')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
    
    const updatedNodeBlur = updatedNodeFilter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', '1')
        .attr('result', 'blur');
    
    updatedNodeBlur.append('animate')
        .attr('attributeName', 'stdDeviation')
        .attr('values', '0.5;2;0.5')
        .attr('dur', '1.2s')
        .attr('repeatCount', '3');

    // НОВЫЕ ГРАДИЕНТЫ ДЛЯ КОМБИНИРОВАННЫХ СОСТОЯНИЙ
    
    // Градиент для новых playout узлов (зелено-фиолетовый)
    const newPlayoutGradient = defs.append('radialGradient')
        .attr('id', 'newPlayoutGradient')
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
    
    newPlayoutGradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', '#b9f6ca')      // Светло-зеленый (новый) в центре
        .style('stop-opacity', 1);
    
    newPlayoutGradient.append('stop')
        .attr('offset', '70%')
        .style('stop-color', '#d8b4fe')      // Смешанный зелено-фиолетовый
        .style('stop-opacity', 1);
        
    newPlayoutGradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', '#e9d5ff')      // Светло-фиолетовый (playout) по краям
        .style('stop-opacity', 1);
    
    // Градиент для обновленных playout узлов (сине-фиолетовый)
    const updatedPlayoutGradient = defs.append('radialGradient')
        .attr('id', 'updatedPlayoutGradient')
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
    
    updatedPlayoutGradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', '#bbdefb')      // Светло-синий (обновленный) в центре
        .style('stop-opacity', 1);
    
    updatedPlayoutGradient.append('stop')
        .attr('offset', '70%')
        .style('stop-color', '#c4b5fd')      // Смешанный сине-фиолетовый
        .style('stop-opacity', 1);
        
    updatedPlayoutGradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', '#e9d5ff')      // Светло-фиолетовый (playout) по краям
        .style('stop-opacity', 1);
    
    // Дополнительный градиент для простых playout узлов
    const playoutGradient = defs.append('radialGradient')
        .attr('id', 'playoutGradient')
        .attr('cx', '50%')
        .attr('cy', '50%')
        .attr('r', '50%');
    
    playoutGradient.append('stop')
        .attr('offset', '0%')
        .style('stop-color', '#f3e8ff')      // Очень светло-фиолетовый в центре
        .style('stop-opacity', 1);
        
    playoutGradient.append('stop')
        .attr('offset', '100%')
        .style('stop-color', '#e9d5ff')      // Светло-фиолетовый по краям
        .style('stop-opacity', 1);
}

export function addNodeCircles(nodeGroups, getNodeRadiusFunc, getNodeState, getNodeChangeStyle, applyNodeStyles, changes, highlightChanges) {
    nodeGroups.append('circle')
        .attr('r', getNodeRadiusFunc)
        .each(function(d) {
            const nodeState = getNodeState(d);
            const visits = d.data.statistics?.numVisits || 0;
            const baseChangeStyle = getNodeChangeStyle(d, changes, highlightChanges);
            
            applyNodeStyles(d3.select(this), nodeState, visits, baseChangeStyle);
        })
        .style('pointer-events', 'none');
}

export function addPercentageLabels(nodeGroups, calculateNodePercentage, isTinyTree, isSmallTree, getNodeRadiusFunc) {
    nodeGroups.each(function(d) {
        const node = d3.select(this);
        const percentage = calculateNodePercentage(d);
        const radius = getNodeRadiusFunc(d);
        
        const fontSize = isTinyTree ? 10 : isSmallTree ? 9 : 8;
        const bgWidth = isTinyTree ? 24 : isSmallTree ? 22 : 20;
        const bgHeight = isTinyTree ? 14 : isSmallTree ? 13 : 12;
        
        const percentageGroup = node.append('g')
            .attr('class', 'percentage-group')
            .attr('transform', `translate(0, ${-radius - 7})`);
        
        percentageGroup.append('rect')
            .attr('class', 'percentage-bg')
            .attr('x', -bgWidth/2) 
            .attr('y', -bgHeight/2)
            .attr('width', bgWidth)
            .attr('height', bgHeight)
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('fill', 'rgba(0, 0, 0, 0.7)')
            .attr('stroke', 'rgba(255, 255, 255, 0.5)')
            .attr('stroke-width', 0.5);
        
        percentageGroup.append('text')
            .attr('class', 'percentage-text')
            .attr('x', 0)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', fontSize)
            .attr('font-weight', 'bold')
            .attr('fill', '#ffffff')
            .text(`${Math.round(percentage)}%`);
    });
}

export function addPlusSignsToNodesWithHiddenChildren(nodeGroups, isTinyTree, isSmallTree, hiddenChildrenIds, filteredChildrenIds, overrideFilterIds) {
    nodeGroups.filter(d => {
        const nodeId = getNodeIdentifier(d);
        return hiddenChildrenIds.has(nodeId) || 
            (filteredChildrenIds.has(nodeId) && !overrideFilterIds.has(nodeId));
    }).each(function(d) {
        const node = d3.select(this);
        const nodeId = getNodeIdentifier(d);
        
        const plusSize = isTinyTree ? 16 : isSmallTree ? 14 : 12;
        
        node.append('text')
            .attr('class', 'plus-sign')
            .attr('x', 0)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'central')
            .attr('font-size', plusSize)
            .attr('font-weight', 'bold')
            .attr('fill', hiddenChildrenIds.has(nodeId) ? 
                TREE_CONSTANTS.COLORS.STROKE.HAS_HIDDEN : 
                TREE_CONSTANTS.COLORS.STROKE.DEPTH_LIMITED
            )
            .text('+');
    });
}

// src/utils/nodeVisualUtils.js - обновить функцию addChangeIndicators

// src/utils/nodeVisualUtils.js - упрощенная версия addChangeIndicators БЕЗ фиолетовых кружочков

export function addChangeIndicators(nodeGroups, changes, isTinyTree) {
    if (!changes) return;
    
    // Новые узлы - только зеленая метка "NEW"
    nodeGroups.filter(d => {
        const nodeId = d.data.id || getNodeIdentifier(d);
        return changes.newNodes && changes.newNodes.includes(nodeId);
    }).each(function(d) {
        const node = d3.select(this);
        const circle = node.select('circle');
        const radius = parseFloat(circle.attr('r'));
        
        // Простая зеленая метка "NEW"
        const labelBg = node.append('rect')
            .attr('x', radius + 3)
            .attr('y', -9)
            .attr('width', 36)
            .attr('height', 18)
            .attr('rx', 4)
            .attr('fill', '#388e3c')
            .attr('opacity', 0.9);
        
        node.append('text')
            .attr('class', 'new-node-label')
            .attr('x', radius + 21)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', isTinyTree ? 13 : 11)
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .text('NEW');
    });
    
    // Обновленные узлы - только синяя метка "+N"
    nodeGroups.filter(d => {
        const nodeId = d.data.id || getNodeIdentifier(d);
        return changes.updatedNodes && changes.updatedNodes.some(node => node.id === nodeId);
    }).each(function(d) {
        const node = d3.select(this);
        const circle = node.select('circle');
        const radius = parseFloat(circle.attr('r'));
        const nodeId = d.data.id || getNodeIdentifier(d);
        
        const updatedNode = changes.updatedNodes.find(n => n.id === nodeId);
        if (!updatedNode) return;
        
        const labelWidth = updatedNode.change < 10 ? 26 : 34;
        
        // Синий фон для изменений
        const changeLabelBg = node.append('rect')
            .attr('x', radius + 3)
            .attr('y', -10)
            .attr('width', labelWidth)
            .attr('height', 18)
            .attr('rx', 4)
            .attr('fill', '#1976d2')
            .attr('opacity', 0.9);
        
        // Текст изменений
        node.append('text')
            .attr('class', 'change-label')
            .attr('x', radius + labelWidth / 2)
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', isTinyTree ? 13 : 11)
            .attr('font-weight', 'bold')
            .attr('fill', 'white')
            .text(`+${updatedNode.change}`);
    });
    
    // УБРАЛИ: Фиолетовые кружочки для playout узлов
    // Теперь playout статус показывается только цветом границы и фоном узла
}

export function animateNewNodes(nodeGroups, changes) {
    if (!changes || !changes.newNodes || changes.newNodes.length === 0) return;
    
    nodeGroups.filter(d => {
        const nodeId = d.data.id || getNodeIdentifier(d);
        return changes.newNodes.includes(nodeId);
    }).each(function() {
        const circle = d3.select(this).select('circle');
        
        // Более выразительная анимация пульсации
        circle
            .attr('r', function() {
                return parseFloat(d3.select(this).attr('r')) * 1.3; // Начинаем с большего размера
            })
            .transition()
            .duration(700)
            .attr('r', function() {
                return parseFloat(d3.select(this).attr('r')) / 1.3;
            })
            .transition()
            .duration(700)
            .attr('r', function() {
                return parseFloat(d3.select(this).attr('r')) * 1.2;
            })
            .transition()
            .duration(700)
            .attr('r', function() {
                return parseFloat(d3.select(this).attr('r')) / 1.2;
            });
    });
}

export function addInteractionHandlers(nodeGroups, dragHandler, handleContextMenu, getNodeState, toggleNodeExpansion, toggleFilterOverride, hiddenChildrenIds, filteredChildrenIds, getNodeRadiusFunc) {
    nodeGroups.append('circle')
        .attr('r', getNodeRadiusFunc)
        .style('fill', 'transparent')
        .style('stroke', 'none')
        .style('cursor', 'pointer')
        .on('contextmenu', (event, d) => handleContextMenu(event, d, getNodeState(d)))
        .on('click', (event, d) => {
            const nodeId = getNodeIdentifier(d);
            if (hiddenChildrenIds.has(nodeId)) {
                toggleNodeExpansion(d);
            } else if (filteredChildrenIds.has(nodeId)) {
                toggleFilterOverride(d);
            }
        })
        .call(dragHandler);
}