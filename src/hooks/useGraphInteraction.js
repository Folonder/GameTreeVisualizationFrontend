// src/hooks/useGraphInteraction.js
import { useCallback, useState, useRef } from 'react';
import * as d3 from 'd3';
import { TREE_CONSTANTS } from '../components/tree/constants';

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

    // Настраиваем перетаскивание узлов
    const setupNodeDrag = useCallback(() => {
        // Создаем обработчик перетаскивания
        const dragHandler = d3.drag()
            .on('start', function(event) {
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
                
                group.attr('transform', `translate(${x + event.dx},${y + event.dy})`);
                
                // Находим все дочерние узлы (с осторожностью)
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
                    
                    // Обновляем позиции всех дочерних узлов
                    descendants.each(function() {
                        try {
                            const g = d3.select(this);
                            const currentTransform = g.attr('transform');
                            if (!currentTransform) return;
                            
                            const currentTranslate = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
                            if (!currentTranslate) return;
                            
                            const currentX = parseFloat(currentTranslate[1]);
                            const currentY = parseFloat(currentTranslate[2]);
                            
                            g.attr('transform', `translate(${currentX + event.dx},${currentY + event.dy})`);
                        } catch (e) {
                            console.error('Error updating descendant position:', e);
                        }
                    });
                    
                    // Обновляем связанные линии (с осторожностью)
                    svg.selectAll('path.link').each(function(link) {
                        try {
                            const linkData = d3.select(this).datum();
                            if (!linkData || !linkData.source || !linkData.target) return;
                            
                            // Получаем связанные узлы
                            const source = linkData.source;
                            const target = linkData.target;
                            
                            // Определяем, связано ли с перетаскиваемым узлом или его потомками
                            const isMoved = source === d || target === d ||
                                            descendants.data().includes(source) || 
                                            descendants.data().includes(target);
                            
                            if (isMoved) {
                                // Получаем текущие позиции узлов
                                const sourceNode = svg.select(`.node[data-id="${source.data.id}"]`);
                                const targetNode = svg.select(`.node[data-id="${target.data.id}"]`);
                                
                                if (!sourceNode.node() || !targetNode.node()) return;
                                
                                // Обновляем путь для линии
                                d3.select(this).attr('d', d3.linkHorizontal()
                                    .x(function(p) {
                                        const node = p === source ? sourceNode : targetNode;
                                        if (!node.node()) return p.y;
                                        
                                        const transform = node.attr('transform');
                                        if (!transform) return p.y;
                                        
                                        const translate = transform.match(/translate\(([^,]+),([^)]+)\)/);
                                        return translate ? parseFloat(translate[1]) : p.y;
                                    })
                                    .y(function(p) {
                                        const node = p === source ? sourceNode : targetNode;
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
            .on('end', function() {
                if (this && this.parentNode) {
                    d3.select(this.parentNode).classed('dragging', false);
                }
            });
        
        return dragHandler;
    }, []);

    // Полностью переработанная функция для настройки панорамирования и масштабирования
    const setupGraphPan = useCallback((svg, mainGroup) => {
        // Если у нас уже есть активная трансформация, используем её
        // Иначе используем сохраненную или дефолтную
        let initialTransform;
        
        if (activeTransformRef.current) {
            initialTransform = activeTransformRef.current;
        } else if (savedTransform) {
            initialTransform = savedTransform;
            activeTransformRef.current = savedTransform; // Сохраняем в ref
        } else {
            initialTransform = d3.zoomIdentity.translate(50, 50).scale(0.5);
            activeTransformRef.current = initialTransform; // Сохраняем в ref
        }

        // Создаем новый объект zoom
        const zoom = d3.zoom()
            .scaleExtent([TREE_CONSTANTS.LAYOUT.ZOOM.MIN, TREE_CONSTANTS.LAYOUT.ZOOM.MAX])
            .on('start', () => {
                userInteractionRef.current = true;
            })
            .on('zoom', (event) => {
                // Обновляем трансформацию группы
                mainGroup.style('transform', `translate(${event.transform.x}px, ${event.transform.y}px) scale(${event.transform.k})`);
                
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

    return { setupNodeDrag, setupGraphPan, savedTransform, updateTransform };
};