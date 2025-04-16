// src/hooks/useGraphInteraction.js - Исправленный для перетаскивания
import { useCallback, useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { TREE_CONSTANTS } from '../components/tree/constants';
import { getNodeIdentifier } from '../utils/treeUtils';

export const useGraphInteraction = () => {
    // Добавляем состояние для хранения текущей трансформации
    const [savedTransform, setSavedTransform] = useState(null);
    // Добавляем ref для отслеживания, была ли уже установлена трансформация
    const isTransformSet = useRef(false);
    // Добавляем ref для хранения последней известной трансформации между рендерами
    const activeTransformRef = useRef(null);
    // Добавляем ref для хранения ссылки на объект zoom
    const zoomRef = useRef(null);
    // Флаг для отслеживания, происходит ли сейчас взаимодействие пользователя
    const userInteractionRef = useRef(false);
    
    // Добавляем хранилище для пользовательских позиций узлов
    const [customNodePositions, setCustomNodePositions] = useState(new Map());
    
    // Для отладки: логирование изменений пользовательских позиций
    useEffect(() => {
        console.log("Custom node positions updated, count:", customNodePositions.size);
    }, [customNodePositions]);

    // Настраиваем перетаскивание узлов
    const setupNodeDrag = useCallback(() => {
        // Создаем обработчик перетаскивания
        const dragHandler = d3.drag()
            .on('start', function(event, d) {
                // Помечаем начало перетаскивания
                event.sourceEvent.stopPropagation();
                console.log("Drag start for node:", getNodeIdentifier(d));
                
                // Поднимаем узел наверх и добавляем класс dragging
                if (this && this.parentNode) {
                    d3.select(this.parentNode).raise().classed('dragging', true);
                }
            })
            .on('drag', function(event, d) {
                if (!this || !this.parentNode) return;
                
                const svg = d3.select(this.ownerSVGElement);
                if (!svg.node()) return;
                
                // Получаем родительский узел (группу g)
                const group = d3.select(this.parentNode);
                if (!group.node()) return;
                
                // Получаем текущую трансформацию и обновляем позицию
                const transform = group.attr('transform');
                if (!transform) return;
                
                const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
                if (!translate) return;
                
                const x = parseFloat(translate[1]);
                const y = parseFloat(translate[2]);
                
                // Обновляем положение в DOM для обеспечения плавности движения
                group.attr('transform', `translate(${x + event.dx},${y + event.dy})`);
                
                // Временно храним текущие координаты в атрибутах data для использования в событии end
                group.attr('data-drag-x', x + event.dx);
                group.attr('data-drag-y', y + event.dy);
                
                // Находим все дочерние узлы с помощью d3.hierarchy API
                try {
                    const descendants = svg.selectAll('.node')
                        .filter(function() {
                            try {
                                const thisData = d3.select(this).datum();
                                if (!thisData || !thisData.parent) return false;
                                
                                let current = thisData;
                                while (current.parent) {
                                    if (current.parent === d) return true;
                                    current = current.parent;
                                }
                                return false;
                            } catch (e) {
                                return false;
                            }
                        });
                    
                    // Обновляем позиции всех дочерних узлов в DOM
                    descendants.each(function() {
                        try {
                            const g = d3.select(this);
                            const currentTransform = g.attr('transform');
                            if (!currentTransform) return;
                            
                            const currentTranslate = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
                            if (!currentTranslate) return;
                            
                            const currentX = parseFloat(currentTranslate[1]);
                            const currentY = parseFloat(currentTranslate[2]);
                            
                            // Обновляем DOM с новой позицией
                            g.attr('transform', `translate(${currentX + event.dx},${currentY + event.dy})`);
                            g.attr('data-drag-x', currentX + event.dx);
                            g.attr('data-drag-y', currentY + event.dy);
                        } catch (e) {
                            console.error('Error updating descendant position:', e);
                        }
                    });
                    
                    // Обновляем связанные линии (с осторожностью)
                    svg.selectAll('path.link').each(function(link) {
                        try {
                            const linkData = d3.select(this).datum();
                            if (!linkData || !linkData.source || !linkData.target) return;
                            
                            // Определяем, связано ли с перетаскиваемым узлом или его потомками
                            const isMoved = linkData.source === d || linkData.target === d ||
                                            descendants.data().includes(linkData.source) || 
                                            descendants.data().includes(linkData.target);
                            
                            if (isMoved) {
                                // Получаем текущие позиции узлов
                                const sourceNode = svg.select(`.node[data-id="${linkData.source.data.id}"]`);
                                const targetNode = svg.select(`.node[data-id="${linkData.target.data.id}"]`);
                                
                                if (!sourceNode.node() || !targetNode.node()) return;
                                
                                // Обновляем путь для линии
                                d3.select(this).attr('d', d3.linkHorizontal()
                                    .x(function(p) {
                                        const node = p === linkData.source ? sourceNode : targetNode;
                                        if (!node.node()) return p.y;
                                        
                                        const transform = node.attr('transform');
                                        if (!transform) return p.y;
                                        
                                        const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
                                        return translate ? parseFloat(translate[1]) : p.y;
                                    })
                                    .y(function(p) {
                                        const node = p === linkData.source ? sourceNode : targetNode;
                                        if (!node.node()) return p.x;
                                        
                                        const transform = node.attr('transform');
                                        if (!transform) return p.x;
                                        
                                        const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
                                        return translate ? parseFloat(translate[2]) : p.x;
                                    })
                                );
                            }
                        } catch (e) {
                            console.error('Error updating link:', e);
                        }
                    });
                } catch (e) {
                    console.error('Error during drag:', e);
                }
            })
            .on('end', function(event, d) {
                if (!this || !this.parentNode) return;
                
                const parent = d3.select(this.parentNode);
                parent.classed('dragging', false);
                
                // Получаем финальные координаты из атрибутов data-drag
                const finalX = parseFloat(parent.attr('data-drag-x'));
                const finalY = parseFloat(parent.attr('data-drag-y'));
                
                if (isNaN(finalX) || isNaN(finalY)) {
                    console.error("Invalid final coordinates for drag");
                    return;
                }
                
                // Ключевой момент: сохраняем координаты в состоянии
                const nodeId = getNodeIdentifier(d);
                console.log("Drag end for node:", nodeId, "Final position:", finalX, finalY);
                
                // Важно: используем функциональное обновление состояния
                setCustomNodePositions(prev => {
                    const newMap = new Map(prev);
                    // Сохраняем новую позицию
                    newMap.set(nodeId, { 
                        x: finalX, 
                        y: finalY,
                        originalX: d.y,  // Сохраняем оригинальные координаты
                        originalY: d.x 
                    });
                    return newMap;
                });
                
                // Обрабатываем дочерние узлы
                const svg = d3.select(this.ownerSVGElement);
                if (!svg.node()) return;
                
                const descendants = svg.selectAll('.node')
                    .filter(function() {
                        try {
                            const thisData = d3.select(this).datum();
                            if (!thisData || !thisData.parent) return false;
                            
                            let current = thisData;
                            while (current.parent) {
                                if (current.parent === d) return true;
                                current = current.parent;
                            }
                            return false;
                        } catch (e) {
                            return false;
                        }
                    });
                
                // Сохраняем координаты потомков в состоянии
                descendants.each(function() {
                    try {
                        const g = d3.select(this);
                        const childData = g.datum();
                        const childId = getNodeIdentifier(childData);
                        
                        const finalChildX = parseFloat(g.attr('data-drag-x'));
                        const finalChildY = parseFloat(g.attr('data-drag-y'));
                        
                        if (isNaN(finalChildX) || isNaN(finalChildY)) {
                            console.error("Invalid child coordinates for drag");
                            return;
                        }
                        
                        // Используем функциональное обновление для каждого потомка
                        setCustomNodePositions(prev => {
                            const newMap = new Map(prev);
                            const currentPos = newMap.get(childId) || { 
                                x: childData.y, 
                                y: childData.x 
                            };
                            
                            // Сохраняем новую позицию
                            newMap.set(childId, { 
                                x: finalChildX, 
                                y: finalChildY,
                                originalX: currentPos.originalX || childData.y,
                                originalY: currentPos.originalY || childData.x
                            });
                            return newMap;
                        });
                    } catch (e) {
                        console.error('Error saving descendant position:', e);
                    }
                });
            });
        
        return dragHandler;
    }, []);

    // Полностью переработанная функция для настройки панорамирования и масштабирования
    // Полностью переработанная функция для настройки панорамирования и масштабирования
const setupGraphPan = useCallback((svg, mainGroup, nodeCount = 0) => {
    // Определяем начальный масштаб в зависимости от размера дерева
    const determineInitialScale = () => {
        // Определяем размер дерева по количеству узлов
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        
        console.log(`Tree size: ${nodeCount} nodes, Display: ${displayWidth}x${displayHeight}`);
        
        // Для очень маленьких деревьев (менее 20 узлов) начинаем с большого масштаба
        if (nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.NODE_COUNT) {
            return 0.85; // Почти 1:1
        }
        
        // Для малых деревьев (20-50 узлов)
        if (nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT) {
            return 0.7;
        }
        
        // Для средних деревьев (50-200 узлов)
        if (nodeCount < 200) {
            return 0.55;
        }
        
        // Для больших деревьев (200-500 узлов)
        if (nodeCount < 500) {
            return 0.45;
        }
        
        // Для очень больших деревьев
        return 0.35;
    };

    // Определяем начальное смещение в зависимости от размера дерева
    const determineInitialTranslation = () => {
        // Для маленьких деревьев - центрируем ближе к началу
        if (nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.TINY_TREE.NODE_COUNT) {
            return [100, Math.min(200, window.innerHeight / 4)]; // Ближе к центру экрана
        }
        
        // Для средних деревьев
        if (nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT) {
            return [80, Math.min(150, window.innerHeight / 5)];
        }
        
        // Для больших деревьев - стандартный отступ
        return [50, 50];
    };

    // Если у нас уже есть активная трансформация, используем её
    // Иначе используем сохраненную или дефолтную
    let initialTransform;

    if (activeTransformRef.current) {
        initialTransform = activeTransformRef.current;
    } else if (savedTransform) {
        initialTransform = savedTransform;
        activeTransformRef.current = savedTransform; // Сохраняем в ref
    } else {
        const initialScale = determineInitialScale();
        const [initialX, initialY] = determineInitialTranslation();
        initialTransform = d3.zoomIdentity.translate(initialX, initialY).scale(initialScale);
        activeTransformRef.current = initialTransform; // Сохраняем в ref
    }

    // Создаем новый объект zoom с адаптивными пределами масштабирования
    const zoom = d3.zoom()
        .scaleExtent([
            TREE_CONSTANTS.LAYOUT.ZOOM.MIN * 0.8, // Немного уменьшаем минимальный масштаб
            // Увеличиваем максимальный масштаб для маленьких деревьев
            nodeCount < TREE_CONSTANTS.ADAPTIVE_SCALING.SMALL_TREE.NODE_COUNT ? 
                TREE_CONSTANTS.LAYOUT.ZOOM.MAX * 2 : 
                TREE_CONSTANTS.LAYOUT.ZOOM.MAX
        ])
        .on('start', () => {
            userInteractionRef.current = true;
        })
        .on('zoom', (event) => {
            // Обновляем трансформацию группы
            mainGroup.style('transform', `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`);
            
            // Подстраиваем размер текста и элементов под обратный масштаб
            // для сохранения их визуального размера
            const inverseScale = 1 / event.transform.k;
            mainGroup.selectAll('.percentage-text, .plus-sign')
                .style('transform', `scale(${inverseScale})`);
            mainGroup.selectAll('.percentage-bg')
                .style('transform', `scale(${inverseScale})`);

            // Добавляем автоматическое подстраивание текста процентов при большом масштабе
            // Это особенно полезно для маленьких деревьев
            if (event.transform.k > 1.2) {
                mainGroup.selectAll('.percentage-text')
                    .style('font-size', `${8 * inverseScale}px`);
                mainGroup.selectAll('.percentage-bg')
                    .attr('width', 20 * inverseScale)
                    .attr('height', 12 * inverseScale);
            }

            // Сохраняем активную трансформацию в ref всегда
            activeTransformRef.current = event.transform;
            
            // Обновляем состояние только при взаимодействии пользователя
            if (event.sourceEvent) {
                setSavedTransform(event.transform);
            }
        })
        .on('end', () => {
            userInteractionRef.current = false;
        });
    
    // Сохраняем объект zoom в ref
    zoomRef.current = zoom;
    
    // Применяем zoom к SVG
    svg.call(zoom);
    
    // Применяем трансформацию только один раз при первой загрузке
    if (!isTransformSet.current) {
        svg.call(zoom.transform, initialTransform);
        isTransformSet.current = true;
    } else {
        // Для последующих рендеров напрямую применяем трансформацию к группе
        // без вызова zoom.transform
        mainGroup.style('transform', `translate(${initialTransform.x}px, ${initialTransform.y}px) scale(${initialTransform.k})`);
    }
    
    // Возвращаем функцию для очистки
    return () => {
        svg.on('.zoom', null);
    };
}, [savedTransform]);

    // Добавляем функцию для программного обновления трансформации
    const updateTransform = useCallback((newTransform) => {
        activeTransformRef.current = newTransform;
        setSavedTransform(newTransform);
    }, []);
    
    // Функция для сброса положения узла
    const resetNodePosition = useCallback((nodeId) => {
        console.log("Resetting position for node:", nodeId);
        setCustomNodePositions(prev => {
            const newMap = new Map(prev);
            // Удаляем узел из Map, чтобы использовалось исходное положение
            newMap.delete(nodeId);
            
            // Находим и удаляем также всех потомков этого узла
            // Это необходимо, чтобы вся ветвь вернулась в исходное положение
            for (const [key, position] of prev.entries()) {
                if (key.startsWith(nodeId + '-') || key.includes('-' + nodeId + '-')) {
                    newMap.delete(key);
                }
            }
            
            return newMap;
        });
    }, []);

    return { 
        setupNodeDrag, 
        setupGraphPan, 
        savedTransform, 
        updateTransform,
        customNodePositions,
        setCustomNodePositions,
        resetNodePosition  // Экспортируем функцию сброса
    };
}