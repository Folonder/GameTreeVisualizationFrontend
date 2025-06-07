// src/hooks/useTreeRenderer.js
import { useCallback, useState, useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { TREE_CONSTANTS } from '../components/tree/constants';
import { getNodeChangeStyle, getNodeRadius, applyNodeStyles } from '../utils/nodeRenderUtils';
import { createTreeLayout, determineTreeSize, applyCustomPositions, renderLinks } from '../utils/treeLayoutUtils';
import { createSvgFilters, addNodeCircles, addPercentageLabels, addPlusSignsToNodesWithHiddenChildren, 
         addChangeIndicators, animateNewNodes, addInteractionHandlers } from '../utils/nodeVisualUtils';
import { prepareHierarchyData, processVisibleNodes, createVisibleLinks } from '../utils/treeDataProcessor';

export const useTreeRenderer = (props) => {
    const {
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
        customNodePositions,
        changes,
        highlightChanges
    } = props;

    const svgRef = useRef(null);
    const mainGroupRef = useRef(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        totalNodes: 0,
        visibleNodes: 0,
        maxDepth: 0
    });

    // Используем ref для хранения флага, чтобы избежать бесконечных циклов
    const renderingRef = useRef(false);
    // Ref для хранения предыдущих данных для определения, нужен ли рендер
    const prevDataRef = useRef(null);
    const prevPropsRef = useRef({});

    // Проверка, изменились ли критические пропсы
    const havePropsChanged = useCallback(() => {
        if (!prevPropsRef.current) return true;
        
        // Проверяем только те свойства, от которых реально зависит рендеринг
        return (
            prevPropsRef.current.data !== data ||
            prevPropsRef.current.hiddenChildrenIds !== hiddenChildrenIds ||
            prevPropsRef.current.filteredChildrenIds !== filteredChildrenIds ||
            prevPropsRef.current.overrideFilterIds !== overrideFilterIds ||
            prevPropsRef.current.changes !== changes || 
            prevPropsRef.current.highlightChanges !== highlightChanges
        );
    }, [
        data,
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds,
        changes,
        highlightChanges
    ]);

    const renderTree = useCallback(() => {
        // Защита от повторного рендеринга во время уже запущенного
        if (renderingRef.current) return;
        // Проверка наличия данных и DOM-элемента
        if (!data || !svgRef.current) return;
        
        // Устанавливаем флаг, что рендеринг запущен
        renderingRef.current = true;
        setIsLoading(true);
    
        try {
            // Очищаем SVG
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();
            
            svg.attr('width', TREE_CONSTANTS.DIMENSIONS.WIDTH)
               .attr('height', TREE_CONSTANTS.DIMENSIONS.HEIGHT);
    
            // Обработка данных и определение характеристик размера дерева
            const { hierarchy, allNodes } = prepareHierarchyData(data);
            if (!hierarchy) throw new Error("Failed to process hierarchy data");
            
            const { 
                nodeCount, maxDepth, isTinyTree, isSmallTree,
                verticalSpacingMultiplier, nodeSpacingMultiplier 
            } = determineTreeSize(data);
            
            // Создание макета дерева и обработка позиций
            const treeLayout = createTreeLayout(
                data, 
                verticalSpacingMultiplier, 
                nodeSpacingMultiplier, 
                isTinyTree, 
                isSmallTree
            );
            
            // Применяем макет и затем пользовательские позиции
            const root = treeLayout(hierarchy);
            applyCustomPositions(allNodes, customNodePositions);
            
            // Добавляем SVG-фильтры для анимаций
            createSvgFilters(svg);
            
            // Обрабатываем видимые узлы и связи
            const { visibleNodes, nodeStates } = processVisibleNodes(root, shouldShowNode, getNodeState);
            const visibleLinks = createVisibleLinks(visibleNodes);
            
            // Создаем основную группу для графа
            const g = svg.append('g')
                .attr('transform', `translate(${TREE_CONSTANTS.DIMENSIONS.MARGIN}, ${TREE_CONSTANTS.DIMENSIONS.MARGIN})`);
            
            mainGroupRef.current = g.node();
            setupGraphPan(svg, g, nodeCount);
    
            // Рендерим связи
            renderLinks(g, visibleLinks, nodeCount);
    
            // Подготавливаем обработчик перетаскивания
            const dragHandler = setupNodeDrag();
    
            // Находим посещения корневого узла для масштабирования
            const rootNode = allNodes.find(node => node.depth === 0);
            const rootVisits = rootNode?.data.statistics?.numVisits || 1;
            
            // Рассчитываем функцию радиуса узла
            const getNodeRadiusFunc = node => getNodeRadius(node, nodeCount, rootVisits);
            
            // Создаем группы узлов
            const nodeGroups = g.selectAll('g.node')
                .data(visibleNodes)
                .join('g')
                .attr('class', 'node')
                .attr('data-id', d => d.data.id)
                .attr('transform', d => `translate(${d.y},${d.x})`);
            
            // Добавляем визуальные элементы к узлам
            addNodeCircles(
                nodeGroups, 
                getNodeRadiusFunc, 
                getNodeState, 
                (node) => getNodeChangeStyle(node, changes, highlightChanges),
                applyNodeStyles,
                changes, 
                highlightChanges
            );
            
            addPercentageLabels(
                nodeGroups, 
                calculateNodePercentage, 
                isTinyTree, 
                isSmallTree, 
                getNodeRadiusFunc
            );
            
            addPlusSignsToNodesWithHiddenChildren(
                nodeGroups, 
                isTinyTree, 
                isSmallTree, 
                hiddenChildrenIds, 
                filteredChildrenIds, 
                overrideFilterIds
            );
            
            addChangeIndicators(nodeGroups, changes, isTinyTree);
            
            // Добавляем обработчики взаимодействия
            addInteractionHandlers(
                nodeGroups,
                dragHandler,
                handleContextMenu,
                getNodeState,
                toggleNodeExpansion,
                toggleFilterOverride,
                hiddenChildrenIds,
                filteredChildrenIds,
                getNodeRadiusFunc
            );
            
            // Добавляем анимации для новых узлов
            if (highlightChanges && changes && changes.newNodes && changes.newNodes.length > 0) {
                animateNewNodes(nodeGroups, changes);
            }
    
            // Обновляем статистику
            setStats({
                totalNodes: allNodes.length,
                visibleNodes: visibleNodes.length,
                maxDepth: maxDepth
            });
            
            setError(null);
        } catch (err) {
            console.error('Error rendering tree:', err);
            setError(err.message);
            if (onError) onError(err);
        } finally {
            // Сохраняем текущие данные и пропсы
            prevDataRef.current = data;
            prevPropsRef.current = {
                data,
                hiddenChildrenIds,
                filteredChildrenIds,
                overrideFilterIds,
                changes,
                highlightChanges
            };
            
            setIsLoading(false);
            renderingRef.current = false;
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
        customNodePositions,
        changes,
        highlightChanges
    ]);

    // Упрощенный useEffect, который запускает renderTree только при реальных изменениях
    useEffect(() => {
        // Проверяем, нужно ли обновлять дерево
        if (data && svgRef.current && havePropsChanged() && !renderingRef.current) {
            // Запускаем рендеринг дерева
            renderTree();
        }
    }, [renderTree, data, havePropsChanged]);

    // Возвращаем те же props, что и раньше
    return {
        svgRef,
        renderTree,
        isLoading,
        error,
        stats
    };
};