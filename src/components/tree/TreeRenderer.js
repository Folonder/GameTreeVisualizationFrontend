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
    updateTransform,
    customNodePositions,
    setCustomNodePositions,
    changes,
    highlightChanges
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
            const allNodes = hierarchy.descendants();
            
            // Определяем размер дерева
            const nodeCount = allNodes.length;
            const maxDepth = Math.max(...allNodes.map(d => d.depth), 0);
            
            // Адаптивно настраиваем размер и расстояние на основе размера дерева
            const isSmallTree = nodeCount < 20 || maxDepth < 3;
            
            // Настройка расстояния на основе размера дерева
            const verticalSpacingMultiplier = isSmallTree ? 1.0 : 2.5; // Меньший множитель для маленьких деревьев
            const nodeSpacingMultiplier = isSmallTree ? 2.5 : 1.5; // Больший множитель для маленьких деревьев
            
            // Add unique IDs for nodes
            allNodes.forEach(node => {
                if (!node.data.id) {
                    node.data.id = getNodeIdentifier(node);
                }
            });
            
            // Настраиваем макет дерева
            const treeLayout = d3.tree()
                .size([
                    // Адаптивное вертикальное пространство
                    (TREE_CONSTANTS.DIMENSIONS.HEIGHT - TREE_CONSTANTS.DIMENSIONS.PADDING) * verticalSpacingMultiplier,
                    TREE_CONSTANTS.DIMENSIONS.WIDTH - TREE_CONSTANTS.DIMENSIONS.PADDING
                ])
                .separation((a, b) => {
                    // Адаптивное горизонтальное расстояние
                    const baseDistance = a.parent === b.parent 
                        ? TREE_CONSTANTS.LAYOUT.SEPARATION.SIBLINGS * nodeSpacingMultiplier
                        : TREE_CONSTANTS.LAYOUT.SEPARATION.NON_SIBLINGS * nodeSpacingMultiplier;
                    
                    // Дополнительная настройка для маленьких деревьев
                    if (isSmallTree) {
                        return baseDistance + 0.5; // Добавляем немного больше пространства для маленьких деревьев
                    }

                    // Учитываем размер узлов при определении расстояния
                    const sizeAdjustment = Math.max(
                        Math.sqrt(a.data.statistics?.numVisits || 0),
                        Math.sqrt(b.data.statistics?.numVisits || 0)
                    ) / 40;

                    return baseDistance + sizeAdjustment;
                });
            
            // ВАЖНО: Сначала применяем макет для расчета базовых координат,
            // а затем заменяем их пользовательскими позициями, если они есть
            const root = treeLayout(hierarchy);
            
            // После расчета базовых координат, заменяем их пользовательскими
            // позициями, если таковые имеются
            allNodes.forEach(node => {
                const nodeId = getNodeIdentifier(node);
                const customPosition = customNodePositions.get(nodeId);

                if (customPosition) {
                    // Если у нас есть сохраненная позиция для этого узла,
                    // используем ее вместо автоматически рассчитанной
                    node.x = customPosition.y; // Обратите внимание на x <-> y из-за ориентации дерева
                    node.y = customPosition.x;
                }
            });
            
            // Добавляем фильтры для эффектов анимации
            const defs = svg.append('defs');
            
            // Фильтр свечения для новых узлов
            const newNodeFilter = defs.append('filter')
                .attr('id', 'glow-new-node')
                .attr('x', '-50%')
                .attr('y', '-50%')
                .attr('width', '200%')
                .attr('height', '200%');
                
            newNodeFilter.append('feGaussianBlur')
                .attr('stdDeviation', '3')
                .attr('result', 'blur');
                
            newNodeFilter.append('feComposite')
                .attr('in', 'SourceGraphic')
                .attr('in2', 'blur')
                .attr('operator', 'over');
            
            // Фильтр пульсации для обновленных узлов
            const updatedNodeFilter = defs.append('filter')
                .attr('id', 'pulse-updated-node')
                .attr('x', '-50%')
                .attr('y', '-50%')
                .attr('width', '200%')
                .attr('height', '200%');
                
            const animBlur = updatedNodeFilter.append('feGaussianBlur')
                .attr('in', 'SourceGraphic')
                .attr('stdDeviation', '1')
                .attr('result', 'blur');
                
            // Добавляем анимацию для обновленных узлов
            animBlur.append('animate')
                .attr('attributeName', 'stdDeviation')
                .attr('values', '1;2;1')
                .attr('dur', '1.5s')
                .attr('repeatCount', '3');
            
            // Функция для определения адаптивного радиуса узлов
            // Функция для определения адаптивного радиуса узлов
const getNodeRadius = (d) => {
    // Получаем максимальное количество посещений в дереве
    const maxVisits = allNodes.reduce((max, node) => {
        const visits = node.data.statistics?.numVisits || 0;
        return Math.max(max, visits);
    }, 1); // Минимум 1, чтобы избежать деления на ноль
    
    // Получаем количество посещений текущего узла
    const visits = d.data.statistics?.numVisits || 0;
    
    // Если это листовой узел или узел с малым количеством посещений
    if ((!d.children || d.children.length === 0) && visits < maxVisits * 0.1) {
        // Малый узел - уменьшенный размер
        const sizeRatio = Math.max(0.2, visits / (maxVisits * 0.1));
        const minSmallRadius = TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS * 0.8;
        return minSmallRadius + (TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS * 0.5 - minSmallRadius) * sizeRatio;
    }
    
    // Для малопосещаемых внутренних узлов - средний размер
    if (visits < maxVisits * 0.3) {
        const sizeRatio = Math.max(0.4, visits / (maxVisits * 0.3));
        const mediumRadius = TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS * 0.7;
        return TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS + (mediumRadius - TREE_CONSTANTS.DIMENSIONS.NODE.MIN_RADIUS) * sizeRatio;
    }
    
    // Для хорошо исследованных узлов - большой размер
    const sizeRatio = Math.max(0.6, visits / maxVisits);
    return TREE_CONSTANTS.DIMENSIONS.NODE.MAX_RADIUS * sizeRatio;
};
            
            // Helper для определения стиля узла, основанного на изменениях
            const getNodeChangeStyle = (d) => {
                if (!highlightChanges || !changes) return {};
                
                const nodeId = d.data.id || getNodeIdentifier(d);
                
                // Проверяем, является ли узел новым
                if (changes.newNodes && changes.newNodes.includes(nodeId)) {
                    return {
                        stroke: '#4caf50', // Зеленый цвет для новых узлов
                        strokeWidth: 4,
                        filter: 'url(#glow-new-node)',
                        strokeOpacity: 1
                    };
                }
                
                // Проверяем, был ли узел обновлен
                const updatedNode = changes.updatedNodes && 
                    changes.updatedNodes.find(node => node.id === nodeId);
                
                if (updatedNode) {
                    // Вычисляем интенсивность подсветки на основе изменения
                    const changeRatio = Math.min(1, updatedNode.change / 20); // Ограничиваем до 1
                    return {
                        stroke: '#2196f3', // Синий цвет для обновленных узлов
                        strokeWidth: 2 + 2 * changeRatio, // Увеличиваем толщину линии
                        strokeDasharray: updatedNode.change > 10 ? '5,2' : '', // Пунктирная линия для больших обновлений
                        filter: changeRatio > 0.5 ? 'url(#pulse-updated-node)' : '',
                        strokeOpacity: 1
                    };
                }
                
                return {};
            };
            
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
            
            // Add visible circles for nodes
            nodeGroups.append('circle')
                .attr('r', getNodeRadius)
                .each(function(d) {
                    const nodeState = nodeStates.get(d);
                    const visits = d.data.statistics?.numVisits || 0;
                    const baseStyle = getNodeStyle(nodeState, visits);
                    const changeStyle = getNodeChangeStyle(d);
                    
                    // Применяем базовые стили
                    Object.entries(baseStyle).forEach(([key, value]) => {
                        d3.select(this).style(key, value);
                    });
                    
                    // Применяем стили изменений, если они есть
                    Object.entries(changeStyle).forEach(([key, value]) => {
                        d3.select(this).style(key, value);
                    });
                })
                .style('pointer-events', 'none'); // Disable events so they're handled by the invisible circle
            
            // Группируем фон и текст для единого масштабирования, но делаем их меньше
            nodeGroups.each(function(d) {
                const node = d3.select(this);
                const percentage = calculateNodePercentage(d);
                const radius = getNodeRadius(d);
                
                // Создаем группу для процентов
                const percentageGroup = node.append('g')
                    .attr('class', 'percentage-group')
                    // Уменьшаем отступ, чтобы проценты были ближе к вершине
                    .attr('transform', `translate(0, ${-radius - 7})`); 
                
                // Добавляем фон меньшего размера
                percentageGroup.append('rect')
                    .attr('class', 'percentage-bg')
                    .attr('x', -10) // Еще уменьшаем ширину
                    .attr('y', -6)  // Уменьшаем высоту
                    .attr('width', 20) // Уменьшаем ширину
                    .attr('height', 12) // Уменьшаем высоту
                    .attr('rx', 2) // Меньшее скругление
                    .attr('ry', 2)
                    .attr('fill', 'rgba(0, 0, 0, 0.7)')
                    .attr('stroke', 'rgba(255, 255, 255, 0.5)')
                    .attr('stroke-width', 0.5);
                
                // Добавляем текст меньшего размера
                percentageGroup.append('text')
                    .attr('class', 'percentage-text')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'central')
                    .attr('font-size', 8) // Еще меньший размер шрифта
                    .attr('font-weight', 'bold')
                    .attr('fill', '#ffffff')
                    .text(`${Math.round(percentage)}%`);
                    
                // Добавляем метки для изменений
                if (highlightChanges && changes) {
                    const nodeId = d.data.id || getNodeIdentifier(d);
                    const updatedNode = changes.updatedNodes && 
                        changes.updatedNodes.find(node => node.id === nodeId);
                    
                    if (updatedNode) {
                        // Добавляем метку с изменением количества посещений
                        node.append('text')
                            .attr('class', 'change-label')
                            .attr('x', radius + 5)
                            .attr('y', -5)
                            .attr('text-anchor', 'start')
                            .attr('dominant-baseline', 'middle')
                            .attr('font-size', 10)
                            .attr('font-weight', 'bold')
                            .attr('fill', '#2196f3')
                            .text(`+${updatedNode.change}`)
                            .style('filter', 'url(#pulse-updated-node)');
                    }
                }
            });

            // Для символа "+" также создаем отдельную группу с оригинальным стилем
            nodeGroups.filter(d => {
                const nodeId = getNodeIdentifier(d);
                return hiddenChildrenIds.has(nodeId) || 
                    (filteredChildrenIds.has(nodeId) && !overrideFilterIds.has(nodeId));
            }).each(function(d) {
                const node = d3.select(this);
                const nodeId = getNodeIdentifier(d);
                
                // Добавляем знак плюс с оригинальным стилем
                node.append('text')
                    .attr('class', 'plus-sign')
                    .attr('x', 0)
                    .attr('y', 0)
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'central')
                    .attr('font-size', 12) // Еще меньший размер
                    .attr('font-weight', 'bold')
                    .attr('fill', d => {
                        // Возвращаем оригинальный цветовой стиль
                        return hiddenChildrenIds.has(nodeId) ? 
                            TREE_CONSTANTS.COLORS.STROKE.HAS_HIDDEN : 
                            TREE_CONSTANTS.COLORS.STROKE.DEPTH_LIMITED;
                    })
                    .text('+');
            });
            
            // Добавляем анимацию для новых узлов - пульсация размера
            if (highlightChanges && changes && changes.newNodes && changes.newNodes.length > 0) {
                nodeGroups.filter(d => {
                    const nodeId = d.data.id || getNodeIdentifier(d);
                    return changes.newNodes.includes(nodeId);
                }).each(function() {
                    const node = d3.select(this);
                    const circle = node.select('circle');
                    
                    // Анимация пульсации
                    circle
                        .attr('r', function() {
                            return parseFloat(d3.select(this).attr('r')) * 1.2;
                        })
                        .transition()
                        .duration(800)
                        .attr('r', function() {
                            return parseFloat(d3.select(this).attr('r')) / 1.2;
                        })
                        .transition()
                        .duration(800)
                        .attr('r', function() {
                            return parseFloat(d3.select(this).attr('r')) * 1.1;
                        })
                        .transition()
                        .duration(800)
                        .attr('r', function() {
                            return parseFloat(d3.select(this).attr('r')) / 1.1;
                        });
                    
                    // Добавляем метку "New"
                    node.append('text')
                        .attr('class', 'new-node-label')
                        .attr('x', function() {
                            const radius = parseFloat(circle.attr('r'));
                            return radius + 5;
                        })
                        .attr('y', 5)
                        .attr('text-anchor', 'start')
                        .attr('dominant-baseline', 'middle')
                        .attr('font-size', 10)
                        .attr('font-weight', 'bold')
                        .attr('fill', '#4caf50')
                        .text('NEW')
                        .style('filter', 'url(#glow-new-node)');
                });
            }
            
            // Add invisible larger circle for better dragging and context menu
            // Добавляем в конце, чтобы он был поверх всех других элементов
            nodeGroups.append('circle')
                .attr('r', getNodeRadius)
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
        updateTransform,
        customNodePositions,
        setCustomNodePositions,
        changes,
        highlightChanges
    ]);

    // Run rendering when dependencies change
    useEffect(() => {
        renderTree();
    }, [
        renderTree, 
        data, 
        hiddenChildrenIds, 
        overrideFilterIds, 
        filteredChildrenIds,
        changes, // Добавляем changes как зависимость, чтобы перерисовывать при изменении
        highlightChanges
    ]);

    return {
        svgRef,
        renderTree,
        isLoading,
        error,
        stats
    };
};