// src/hooks/useTreeFiltering.js
import { useState, useCallback, useEffect } from 'react';
import * as d3 from 'd3';
import { getNodeIdentifier, calculateNodePercentage } from '../utils/treeUtils';

/**
 * Custom hook for handling tree filtering logic
 */
export const useTreeFiltering = (data) => {
    // Filters state
    const [filters, setFilters] = useState({
        maxDepth: null,
        depthFilters: new Map(),
        isFiltersApplied: false
    });
    
    // Set for storing IDs of nodes whose children should be explicitly hidden (via Hide Children)
    const [hiddenChildrenIds, setHiddenChildrenIds] = useState(new Set());
    
    // Set for storing IDs of nodes whose children are hidden due to filters
    const [filteredChildrenIds, setFilteredChildrenIds] = useState(new Set());
    
    // Set for storing IDs of nodes that are allowed to show children even if they should be hidden by filters
    const [overrideFilterIds, setOverrideFilterIds] = useState(new Set());

    /**
     * Determines if a node should be filtered based on current filters
     */
    const isFilteredByFilters = useCallback((node) => {
        // If filtering is not active, nothing should be filtered
        if (!filters.isFiltersApplied) return false;
        
        // Check if node is directly filtered by depth
        if (filters.maxDepth !== null && node.depth > filters.maxDepth) {
            return true;
        }
        
        // Check if this node's depth has a percentage threshold
        const thresholdForThisDepth = filters.depthFilters.get(node.depth);
        if (thresholdForThisDepth && thresholdForThisDepth > 0) {
            // Calculate the node's percentage
            const nodePercentage = calculateNodePercentage(node);
            
            // If percentage is less than the threshold, filter this node
            if (nodePercentage < thresholdForThisDepth) {
                console.log(`Filtering node at depth ${node.depth}. Percentage: ${nodePercentage.toFixed(1)}%, threshold: ${thresholdForThisDepth}%`);
                return true;
            }
        }
        
        // Check if any parent is filtered by percentage threshold
        let parent = node.parent;
        while (parent) {
            // Skip if parent has an override
            if (overrideFilterIds.has(getNodeIdentifier(parent))) {
                return false;
            }
            
            // Check if parent's depth has a percentage threshold
            const parentThreshold = filters.depthFilters.get(parent.depth);
            if (parentThreshold && parentThreshold > 0) {
                const parentPercentage = calculateNodePercentage(parent);
                if (parentPercentage < parentThreshold) {
                    return true; // Parent is filtered, so this node should be too
                }
            }
            
            // Move up the tree
            parent = parent.parent;
        }
        
        return false;
    }, [filters, overrideFilterIds]);

    /**
     * Toggles the visibility of a node's children (for Hide/Show Children)
     */
    const toggleNodeExpansion = useCallback((node) => {
        if (!node) return;
        
        const nodeId = getNodeIdentifier(node);
        console.log("Toggling expansion for node:", node);
        console.log("Using nodeId:", nodeId);
        
        setHiddenChildrenIds(prev => {
            const next = new Set([...prev]);
            
            if (next.has(nodeId)) {
                // ПОКАЗЫВАЕМ ДЕТЕЙ: Удаляем только текущий узел из hiddenChildrenIds
                console.log("Showing children for nodeId:", nodeId);
                next.delete(nodeId);
                
                // Важно: при показе детей узла мы НЕ удаляем из hiddenChildrenIds
                // его внуков и далее - они должны оставаться скрытыми
            } else {
                // СКРЫВАЕМ ДЕТЕЙ: Добавляем узел в hiddenChildrenIds
                console.log("Hiding children for nodeId:", nodeId);
                next.add(nodeId);
                
                // Рекурсивно добавляем всех потомков в hiddenChildrenIds
                const addDescendantsToHidden = (parentNode) => {
                    if (parentNode.children && parentNode.children.length > 0) {
                        parentNode.children.forEach(child => {
                            // Добавляем все дочерние узлы в hiddenChildrenIds
                            const childId = getNodeIdentifier(child);
                            next.add(childId);
                            
                            // Рекурсивно добавляем их детей
                            addDescendantsToHidden(child);
                        });
                    }
                };
                
                // Запускаем рекурсивное добавление потомков
                addDescendantsToHidden(node);
            }
            
            return next;
        });
    }, [getNodeIdentifier]);

    /**
     * Toggles filter override for a node
     */
    const toggleFilterOverride = useCallback((node) => {
        if (!node) return;
        
        const nodeId = getNodeIdentifier(node);
        console.log("Toggling filter override for node:", node);
        console.log("Using nodeId:", nodeId);
        
        setOverrideFilterIds(prev => {
            const next = new Set([...prev]);
            
            if (next.has(nodeId)) {
                // Удаляем переопределение фильтра для этого узла
                console.log("Removing filter override for nodeId:", nodeId);
                next.delete(nodeId);
                
                // Также удаляем переопределения фильтров для всех потомков
                const removeDescendantOverrides = (parentNode) => {
                    if (parentNode.children && parentNode.children.length > 0) {
                        parentNode.children.forEach(child => {
                            const childId = getNodeIdentifier(child);
                            if (next.has(childId)) {
                                next.delete(childId);
                            }
                            removeDescendantOverrides(child);
                        });
                    }
                };
                
                removeDescendantOverrides(node);
            } else {
                // Добавляем переопределение фильтра ТОЛЬКО для этого узла
                console.log("Adding filter override for nodeId:", nodeId);
                next.add(nodeId);
                
                // НЕ добавляем переопределения для потомков -
                // это обеспечивает показ только непосредственных детей
            }
            
            return next;
        });
    }, [getNodeIdentifier]);

    /**
     * Applies new filters to the tree
     */
    const applyFilters = useCallback((newFilters) => {
        // Обновляем состояние фильтров
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            isFiltersApplied: true
        }));
        
        // Очищаем переопределения фильтров, так как применяются новые фильтры
        setOverrideFilterIds(new Set());
        
        // Важно: НЕ НУЖНО очищать hiddenChildrenIds
        // Это предотвращает сворачивание дерева к корню при применении фильтров
        
        // Обновляем filteredChildrenIds на основе новых фильтров
        if (data) {
            const hierarchy = d3.hierarchy(data);
            const allNodes = hierarchy.descendants();
            
            // Определяем, какие узлы имеют детей, которые должны быть скрыты фильтром
            const newFilteredChildrenIds = new Set();
            const defaultExpandedNodesIds = new Set();
            
            // Сначала определим узлы, которые проходят фильтры и должны быть видимыми,
            // даже если их родители имеют скрытых детей
            let remainingVisibleNodes = allNodes.filter((node) => {
                // Пропускаем скрытие по глубине
                if (newFilters.maxDepth !== null && node.depth > newFilters.maxDepth) {
                    return false;
                }
                
                // Проверяем фильтр процента
                const threshold = newFilters.depthFilters.get(node.depth);
                if (threshold && threshold > 0) {
                    const nodePercentage = calculateNodePercentage(node);
                    if (nodePercentage < threshold) {
                        return false;
                    }
                }
                
                return true;
            });
            
            // Мы хотим сохранить развернутым путь до каждого видимого узла
            remainingVisibleNodes.forEach(node => {
                // Добавляем все родительские узлы в defaultExpandedNodesIds
                let current = node.parent;
                while (current) {
                    defaultExpandedNodesIds.add(getNodeIdentifier(current));
                    current = current.parent;
                }
            });
                    
            // Определяем узлы, у которых есть дети, скрытые фильтром
            allNodes.forEach(node => {
                if (node.children && node.children.length > 0) {
                    // Проверяем, есть ли дети, которые должны быть скрыты фильтром
                    const hasFilteredChildren = node.children.some(child => {
                        // Проверяем по глубине
                        if (newFilters.maxDepth !== null && child.depth > newFilters.maxDepth) {
                            return true;
                        }
                        
                        // Проверяем по проценту
                        const threshold = newFilters.depthFilters.get(child.depth);
                        if (threshold && threshold > 0) {
                            const visits = child.data.statistics?.numVisits || 0;
                            const totalVisits = node.children.reduce((sum, sibling) => 
                                sum + (sibling.data.statistics?.numVisits || 0), 0);
                            
                            const percentage = totalVisits > 0 ? (visits / totalVisits * 100) : 0;
                            
                            return percentage < threshold;
                        }
                        
                        return false;
                    });
                    
                    if (hasFilteredChildren) {
                        newFilteredChildrenIds.add(getNodeIdentifier(node));
                    }
                }
            });
            
            // Добавляем переопределения фильтров для узлов, которые должны оставаться видимыми
            const newOverrideFilterIds = new Set();
            defaultExpandedNodesIds.forEach(nodeId => {
                if (newFilteredChildrenIds.has(nodeId)) {
                    newOverrideFilterIds.add(nodeId);
                }
            });
            
            // Обновляем состояние с новыми отфильтрованными узлами и переопределениями
            setFilteredChildrenIds(newFilteredChildrenIds);
            setOverrideFilterIds(newOverrideFilterIds);
        }
    }, [data, calculateNodePercentage, getNodeIdentifier]);

    /**
     * Resets all filters and hidden nodes
     */
    const resetFilters = useCallback(() => {
        setFilters({
            maxDepth: null,
            depthFilters: new Map(),
            isFiltersApplied: false
        });
        setHiddenChildrenIds(new Set());
        setFilteredChildrenIds(new Set());
        setOverrideFilterIds(new Set());
    }, []);

    /**
     * Определяет, должен ли узел быть видимым, учитывая, что сам узел
     * не должен скрываться при скрытии его детей
     */
    const shouldShowNode = useCallback((node) => {
        // Узел не должен быть скрыт, если он сам является целью скрытия детей
        // Поэтому мы НЕ делаем эту проверку:
        // if (hiddenChildrenIds.has(getNodeIdentifier(node))) {
        //     return false;
        // }
        
        // Проверяем цепочку родителей - нам нужно проверить, не является ли
        // узел дочерним для какого-либо из узлов, дети которого скрыты
        let current = node.parent;
        
        while (current) {
            const currentId = getNodeIdentifier(current);
            
            // Если родитель имеет скрытых детей и для него нет переопределения фильтра,
            // и текущий узел является его прямым ребенком, то этот узел должен быть скрыт
            if (hiddenChildrenIds.has(currentId) && !overrideFilterIds.has(currentId)) {
                return false;
            }
            
            // Если родитель скрыт фильтром и нет переопределения, узел тоже скрыт
            if (filteredChildrenIds.has(currentId) && !overrideFilterIds.has(currentId)) {
                return false;
            }
            
            current = current.parent;
        }
        
        // Проверяем, не скрыт ли узел фильтром по проценту
        if (isFilteredByFilters(node)) {
            // Если у родителя есть переопределение фильтра, показываем узел
            if (node.parent && overrideFilterIds.has(getNodeIdentifier(node.parent))) {
                return true;
            }
            // Иначе скрываем
            return false;
        }
        
        // Если мы дошли до этой точки, узел должен быть видим
        return true;
    }, [filteredChildrenIds, overrideFilterIds, isFilteredByFilters, hiddenChildrenIds, getNodeIdentifier]);

    // Update filteredChildrenIds when filters or data change
    useEffect(() => {
        if (!data) return;
        
        // Use d3.hierarchy to create a hierarchical structure
        const hierarchy = d3.hierarchy(data);
        const allNodes = hierarchy.descendants();
        
        // Determine which nodes have children hidden by filters
        const newFilteredChildrenIds = new Set();
            
        // Check each node with children
        allNodes.forEach(node => {
            if (node.children && node.children.length > 0) {
                // Check if any children are hidden by filters
                const hasFilteredChildren = node.children.some(child => 
                    isFilteredByFilters(child));
                
                if (hasFilteredChildren) {
                    newFilteredChildrenIds.add(getNodeIdentifier(node));
                }
            }
        });
        
        setFilteredChildrenIds(newFilteredChildrenIds);
        
    }, [data, isFilteredByFilters, filters, getNodeIdentifier]);

    return {
        filters,
        hiddenChildrenIds,
        filteredChildrenIds,
        overrideFilterIds,
        isFilteredByFilters,
        toggleNodeExpansion,
        toggleFilterOverride,
        applyFilters,
        resetFilters,
        shouldShowNode
    };
};