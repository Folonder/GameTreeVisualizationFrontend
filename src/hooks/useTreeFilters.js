// src/hooks/useTreeFilters.js
import { useCallback } from 'react';
import { TREE_CONSTANTS } from '../components/tree/constants';

export const useTreeFilters = (depthFilters, hiddenNodes) => {
    const getNodeVisibility = useCallback((node, maxAllowedDepth) => {
        // Проверяем фильтр по глубине
        const threshold = depthFilters.get(node.depth) || 0;
        if (node.data.statistics.relativeVisits < threshold) {
            return 'filtered';
        }
        
        // Проверяем скрытые узлы
        if (hiddenNodes.has(node.parent?.data?.id)) {
            return 'hidden';
        }

        // Проверяем лимит по глубине
        if (node.depth > maxAllowedDepth) {
            return 'limited';
        }

        return 'visible';
    }, [depthFilters, hiddenNodes]);

    const filterNodes = useCallback((nodes) => {
        const nodesByLevel = new Map();
        nodes.forEach(node => {
            const level = nodesByLevel.get(node.depth) || [];
            level.push(node);
            nodesByLevel.set(node.depth, level);
        });

        // Находим максимальную глубину в пределах лимита узлов
        let totalNodes = 0;
        let maxAllowedDepth = 0;
        for (const [depth, levelNodes] of nodesByLevel) {
            totalNodes += levelNodes.length;
            if (totalNodes > TREE_CONSTANTS.MAX_VISIBLE_NODES) {
                break;
            }
            maxAllowedDepth = depth;
        }

        // Применяем фильтры и отмечаем видимость
        const nodesToRemove = new Set();
        const nodeStates = new Map();

        nodes.forEach(node => {
            const visibility = getNodeVisibility(node, maxAllowedDepth);
            nodeStates.set(node, visibility);
            
            if (visibility !== 'visible') {
                nodesToRemove.add(node);
                node.descendants().forEach(descendant => {
                    nodesToRemove.add(descendant);
                    nodeStates.set(descendant, visibility);
                });
            }
        });

        return {
            filteredNodes: nodes.filter(node => !nodesToRemove.has(node)),
            nodeStates
        };
    }, [getNodeVisibility]);

    return { filterNodes };
};