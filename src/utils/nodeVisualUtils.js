// src/utils/nodeVisualUtils.js
import * as d3 from 'd3';
import { getNodeIdentifier } from './treeUtils';
import { TREE_CONSTANTS } from '../components/tree/constants';

export function createSvgFilters(svg) {
    const defs = svg.append('defs');
    
    // Улучшенный фильтр свечения для новых узлов - более яркий и заметный
    const newNodeFilter = defs.append('filter')
        .attr('id', 'glow-new-node')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
    
    // Яркое свечение для новых узлов
    const newNodeGlow = newNodeFilter.append('feGaussianBlur')
        .attr('stdDeviation', '2')
        .attr('result', 'coloredBlur');
    
    // Комбинируем оригинальное изображение и свечение
    const newNodeMerge = newNodeFilter.append('feMerge');
    newNodeMerge.append('feMergeNode')
        .attr('in', 'coloredBlur');
    newNodeMerge.append('feMergeNode')
        .attr('in', 'SourceGraphic');
    
    // Усиленный фильтр пульсации для обновленных узлов
    const updatedNodeFilter = defs.append('filter')
        .attr('id', 'pulse-updated-node')
        .attr('x', '-50%')
        .attr('y', '-50%')
        .attr('width', '200%')
        .attr('height', '200%');
    
    // Создаем более контрастный эффект
    const updatedNodeBlur = updatedNodeFilter.append('feGaussianBlur')
        .attr('in', 'SourceGraphic')
        .attr('stdDeviation', '1')
        .attr('result', 'blur');
    
    // Добавляем анимацию с более заметной пульсацией
    updatedNodeBlur.append('animate')
        .attr('attributeName', 'stdDeviation')
        .attr('values', '0.5;2;0.5')
        .attr('dur', '1.2s')
        .attr('repeatCount', '3');
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

export function addChangeIndicators(nodeGroups, changes, isTinyTree) {
    if (!changes) return;
    
    // Добавление меток "NEW" для новых узлов с улучшенной видимостью
    nodeGroups.filter(d => {
        const nodeId = d.data.id || getNodeIdentifier(d);
        return changes.newNodes && changes.newNodes.includes(nodeId);
    }).each(function(d) {
        const node = d3.select(this);
        const circle = node.select('circle');
        const radius = parseFloat(circle.attr('r'));
        
        // Добавляем фон для лучшей видимости текста
        const newLabelBg = node.append('rect')
            .attr('x', radius + 3)
            .attr('y', -9)
            .attr('width', 36)
            .attr('height', 18)
            .attr('rx', 4)
            .attr('fill', '#388e3c')  // Темно-зеленый фон
            .attr('opacity', 0.9);
        
        // Добавляем более крупный текст с контуром
        node.append('text')
            .attr('class', 'new-node-label')
            .attr('x', radius + 21)  // Центрируем по фону
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', isTinyTree ? 13 : 11)
            .attr('font-weight', 'bold')
            .attr('fill', 'white')   // Белый текст
            .attr('stroke', 'white')
            .attr('stroke-width', 0.2) // Тонкий контур для лучшей читаемости
            .text('NEW');
    });
    
    // Добавление индикаторов изменений для обновленных узлов
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
        
        // Добавляем контрастный фон для индикатора изменений
        const changeLabelBg = node.append('rect')
            .attr('x', radius + 3)
            .attr('y', -10)
            .attr('width', updatedNode.change < 10 ? 26 : 34) // Регулируем ширину в зависимости от числа
            .attr('height', 18)
            .attr('rx', 4)
            .attr('fill', '#1976d2')  // Темно-синий фон
            .attr('opacity', 0.9);
        
        // Добавляем более контрастный текст
        node.append('text')
            .attr('class', 'change-label')
            .attr('x', radius + (updatedNode.change < 10 ? 16 : 20)) // Центрируем на фоне
            .attr('y', 0)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', isTinyTree ? 13 : 11)
            .attr('font-weight', 'bold')
            .attr('fill', 'white')    // Белый текст
            .attr('stroke', 'white') 
            .attr('stroke-width', 0.2) // Тонкий контур для лучшей читаемости
            .text(`+${updatedNode.change}`);
    });
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