// src/hooks/useTreeFiltersState.js
import { useState, useCallback } from 'react';
import { TREE_CONSTANTS } from '../components/tree/constants';

export const useTreeFiltersState = () => {
    // Состояние фильтров
    const [filters, setFilters] = useState({
        maxDepth: null, // Ограничение максимальной глубины
        depthFilters: new Map(),
        isFiltersApplied: false // Фильтры применяются только после явного нажатия кнопки Apply
    });

    // Узлы, дети которых должны быть скрыты
    const [hiddenNodesChildren, setHiddenNodesChildren] = useState(new Set());

    // Переключение видимости детей узла
    const toggleNodeExpansion = useCallback((nodeId) => {
        console.log('Toggling expansion for nodeId:', nodeId);
        console.log('Current hiddenNodesChildren:', [...hiddenNodesChildren]);
        
        setHiddenNodesChildren(prev => {
            const next = new Set(prev);
            if (next.has(nodeId)) {
                console.log('Showing children for nodeId:', nodeId);
                next.delete(nodeId);
            } else {
                console.log('Hiding children for nodeId:', nodeId);
                next.add(nodeId);
            }
            console.log('New hiddenNodesChildren:', [...next]);
            return next;
        });
    }, [hiddenNodesChildren]);

    // Применение фильтров
    const applyFilters = useCallback((newFilters) => {
        setFilters(prev => ({
            ...prev,
            ...newFilters,
            isFiltersApplied: true
        }));
    }, []);

    // Сброс фильтров
    const resetFilters = useCallback(() => {
        setFilters({
            maxDepth: null,
            depthFilters: new Map(),
            isFiltersApplied: false
        });
        // Очищаем также скрытые узлы
        setHiddenNodesChildren(new Set());
    }, []);

    // Проверяет, должен ли узел быть скрыт (является ли он прямым потомком скрытого узла)
    const shouldHideNode = useCallback((node) => {
        if (!node || !node.parent || !node.parent.data) return false;
        const result = hiddenNodesChildren.has(node.parent.data.id);
        
        // Debug log только для нескольких узлов, чтобы не спамить консоль
        if (node.depth < 3) {
            console.log(`shouldHideNode check for node ${node.data.id} (parent: ${node.parent.data.id}): ${result}`);
        }
        
        return result;
    }, [hiddenNodesChildren]);

    // Функция для определения визуального состояния узла (для стилизации)
    const getNodeVisibility = useCallback((node, depth) => {
        // Если у узла есть дети и этот узел в списке тех, чьи дети скрыты
        if (node.children && node.children.length > 0 && hiddenNodesChildren.has(node.data.id)) {
            return TREE_CONSTANTS.NODE_STATES.HAS_HIDDEN_CHILDREN;
        }
        
        // Если у узла есть дети и все они видны
        if (node.children && node.children.length > 0) {
            return TREE_CONSTANTS.NODE_STATES.EXPANDED;
        }
        
        // Если у узла нет детей
        return TREE_CONSTANTS.NODE_STATES.VISIBLE;
    }, [hiddenNodesChildren]);

    return {
        filters,
        applyFilters,
        resetFilters,
        hiddenNodesChildren,
        toggleNodeExpansion,
        shouldHideNode,
        getNodeVisibility
    };
};