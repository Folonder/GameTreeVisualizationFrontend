// hooks/useTreeNodes.js
import { useCallback, useState } from 'react';
import { TREE_CONSTANTS } from '../components/tree/constants';

export const useTreeNodes = () => {
    const [hiddenNodes, setHiddenNodes] = useState(new Set());

    const processNodes = useCallback((nodes) => {
        // Для каждого уровня считаем количество вершин
        const nodesByLevel = new Map();
        nodes.forEach(node => {
            const level = nodesByLevel.get(node.depth) || [];
            level.push(node);
            nodesByLevel.set(node.depth, level);
        });

        // Определяем максимальный уровень в пределах лимита
        let totalNodes = 0;
        let maxAllowedDepth = 0;
        for (const [depth, levelNodes] of nodesByLevel) {
            if (totalNodes + levelNodes.length > TREE_CONSTANTS.MAX_VISIBLE_NODES) {
                break;
            }
            totalNodes += levelNodes.length;
            maxAllowedDepth = depth;
        }

        const nodesToHide = new Set();
        const nodeStates = new Map();

        // Проходим по всем узлам и определяем их состояние
        nodes.forEach(node => {
            // Если родитель скрыт - скрываем и этот узел
            if (node.parent && nodesToHide.has(node.parent)) {
                nodesToHide.add(node);
                nodeStates.set(node, 'parent_hidden');
                return;
            }
            
            // Если узел за пределами максимально допустимой глубины
            if (node.depth > maxAllowedDepth) {
                nodesToHide.add(node);
                nodeStates.set(node, 'depth_limited');
                return;
            }

            // Если узел скрыт пользователем
            if (hiddenNodes.has(node.data.id)) {
                nodeStates.set(node, 'has_hidden_children');
                // Скрываем все дочерние узлы
                node.descendants().slice(1).forEach(child => {
                    nodesToHide.add(child);
                    nodeStates.set(child, 'parent_hidden');
                });
                return;
            }

            nodeStates.set(node, 'visible');
        });

        const visibleNodes = nodes.filter(node => !nodesToHide.has(node));
        const visibleLinks = visibleNodes
            .filter(node => node.parent)
            .map(node => ({ source: node.parent, target: node }));

        return {
            visibleNodes,
            visibleLinks,
            nodeStates
        };
    }, [hiddenNodes]);

    const toggleNodeChildren = useCallback((node) => {
        setHiddenNodes(prev => {
            const next = new Set(prev);
            if (next.has(node.data.id)) {
                next.delete(node.data.id);
            } else {
                next.add(node.data.id);
            }
            return next;
        });
    }, []);

    return {
        processNodes,
        toggleNodeChildren,
        hiddenNodes
    };
};