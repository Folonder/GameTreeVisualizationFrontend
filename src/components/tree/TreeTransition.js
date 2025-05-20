// src/components/tree/TreeTransition.js
import React, {useEffect, useRef, useState} from 'react';
import * as d3 from 'd3';
import {TREE_CONSTANTS} from './constants';
import {getNodeIdentifier} from '../../utils/treeUtils';

const TreeTransition = ({
                            previousTree,
                            nextTree,
                            onTransitionComplete,
                            duration = 2500,
                            currentTurn,
                            nextTurn
                        }) => {
    const svgRef = useRef(null);
    const gRef = useRef(null);
    const [progress, setProgress] = useState(0);
    const [zoomScale, setZoomScale] = useState(1);
    const [selectedNodeInfo, setSelectedNodeInfo] = useState({
        id: '',
        state: '',
        visits: 0
    });

    // Для отслеживания таймера и времени начала анимации
    const timerRef = useRef(null);
    const startTimeRef = useRef(null);
    const elapsedTimeRef = useRef(0);
    const animationRef = useRef(null);

    // Очистка таймера при размонтировании
    useEffect(() => {
        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };
    }, []);

    // Останавливает все текущие d3-анимации на SVG
    const stopAllD3Animations = () => {
        if (svgRef.current) {
            d3.select(svgRef.current).selectAll('*').interrupt();
        }
    };

    // Переход к следующему шагу
    const handleContinue = () => {
        // Очищаем любой текущий таймер
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        stopAllD3Animations();

        // Устанавливаем прогресс в 100% для визуального завершения
        setProgress(1);

        // Вызываем callback завершения
        setTimeout(() => {
            onTransitionComplete();
        }, 100);
    };

    // Полный перезапуск анимации
    const handleRestart = () => {
        // Сначала полностью останавливаем все таймеры и анимации
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        stopAllD3Animations();

        // Сбрасываем состояние
        setProgress(0);
        elapsedTimeRef.current = 0;

        // Полностью перерисовываем SVG
        if (svgRef.current) {
            // Полностью очищаем все содержимое SVG
            const svg = d3.select(svgRef.current);
            svg.selectAll("*").remove();

            // Заново инициализируем визуализацию
            initializeVisualization(svg, previousTree, nextTree);
        }
    };

    // Настройка d3.zoom
    const setupZoom = (svg, g) => {
        const zoom = d3.zoom()
            .scaleExtent([0.1, 5])
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
                setZoomScale(event.transform.k);
            });

        svg.call(zoom);

        // Инициализация с начальной трансформацией
        const initialTransform = d3.zoomIdentity
            .translate(TREE_CONSTANTS.DIMENSIONS.MARGIN, TREE_CONSTANTS.DIMENSIONS.MARGIN)
            .scale(1);

        svg.call(zoom.transform, initialTransform);
    };

    // Функция для инициализации визуализации
    const initializeVisualization = (svg, previousTree, nextTree) => {
        svg.attr('width', '100%')
            .attr('height', '100%')
            .attr('viewBox', `0 0 ${TREE_CONSTANTS.DIMENSIONS.WIDTH} ${TREE_CONSTANTS.DIMENSIONS.HEIGHT}`);

        // Добавляем фон (полностью непрозрачный)
        svg.append('rect')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('fill', '#ffffff');

        // Основная группа для элементов
        const g = svg.append('g')
            .attr('transform', `translate(${TREE_CONSTANTS.DIMENSIONS.MARGIN}, ${TREE_CONSTANTS.DIMENSIONS.MARGIN})`);

        gRef.current = g.node();

        // Настраиваем масштабирование
        setupZoom(svg, g);

        // Создаем иерархии для обоих деревьев
        const previousHierarchy = d3.hierarchy(previousTree);
        const nextHierarchy = d3.hierarchy(nextTree);

        // Применяем макет дерева
        const treeLayout = d3.tree()
            .size([
                TREE_CONSTANTS.DIMENSIONS.HEIGHT - TREE_CONSTANTS.DIMENSIONS.PADDING,
                TREE_CONSTANTS.DIMENSIONS.WIDTH - TREE_CONSTANTS.DIMENSIONS.PADDING
            ]);

        const previousLayout = treeLayout(previousHierarchy);
        const nextLayout = treeLayout(nextHierarchy);

        // Получаем все узлы
        const previousNodes = previousLayout.descendants();
        const nextNodes = nextLayout.descendants();

        // Находим корень в новом дереве
        const nextRoot = nextNodes.find(node => node.depth === 0);
        const nextRootId = nextRoot?.data?.id || null;

        // Ищем узел в предыдущем дереве, который станет корнем в новом
        const newRootInPreviousTree = previousNodes.find(node => {
            return node.data?.id === nextRootId;
        });

        // Если не нашли точное совпадение, попробуем найти похожий узел
        let selectedNode = newRootInPreviousTree;
        if (!selectedNode && nextRoot?.data) {
            // Ищем по состоянию или другим свойствам
            selectedNode = previousNodes.find(node =>
                node.data?.state === nextRoot.data.state
            );
        }

        // Если всё ещё не нашли, выберем произвольный узел 1-го уровня глубины
        if (!selectedNode) {
            selectedNode = previousNodes.find(node => node.depth === 1);
        }

        // Если и это не удалось, просто используем корень предыдущего дерева
        if (!selectedNode) {
            selectedNode = previousNodes[0]; // Корень
        }

        // Собираем информацию о выбранном узле для отображения
        setSelectedNodeInfo({
            id: selectedNode.data?.id || getNodeIdentifier(selectedNode),
            state: selectedNode.data?.state || "Unknown state",
            visits: selectedNode.data?.statistics?.numVisits || 0
        });

        // Разделяем узлы на три категории:
        // 1. Выбранный узел (который станет корнем)
        // 2. Поддерево выбранного узла (которое сохранится)
        // 3. Остальные узлы (которые будут отсечены)
        const selectedNodeId = getNodeIdentifier(selectedNode);

        // Функция для проверки, принадлежит ли узел поддереву выбранного узла
        const isInSelectedSubtree = (node) => {
            if (node === selectedNode) return true;

            let current = node;
            while (current.parent) {
                if (current.parent === selectedNode) return true;
                current = current.parent;
            }

            return false;
        };

        // Разделяем узлы
        const keptSubtree = previousNodes.filter(isInSelectedSubtree);
        const nodesToRemove = previousNodes.filter(node => !isInSelectedSubtree(node));

        // Функция для расчета размера узла (такого же, как в основном дереве)
        const calculateNodeRadius = (node) => {
            const visits = node.data.statistics?.numVisits || 0;
            // Более скромный размер узлов, соответствующий основному дереву
            return Math.max(4, Math.min(8, Math.sqrt(visits) / 3));
        };

        // Визуализация отсекаемых узлов (красным)
        g.selectAll('.node-to-remove')
            .data(nodesToRemove)
            .join('g')
            .attr('class', 'node-to-remove')
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .append('circle')
            .attr('r', calculateNodeRadius) // Используем расчет размера узла
            .style('fill', 'rgba(239, 68, 68, 0.7)')
            .style('stroke', '#dc2626')
            .style('stroke-width', 1); // Уменьшенная толщина

        // Визуализация связей для отсекаемых узлов
        g.selectAll('.link-to-remove')
            .data(nodesToRemove.filter(d => d.parent))
            .join('path')
            .attr('class', 'link-to-remove')
            .attr('d', d => d3.linkHorizontal()
                .x(node => node.y)
                .y(node => node.x)({
                    source: d.parent,
                    target: d
                }))
            .style('fill', 'none')
            .style('stroke', '#ef4444')
            .style('stroke-width', 1) // Уменьшенная толщина
            .style('stroke-dasharray', '3,2'); // Меньший шаг пунктира

        // Визуализация сохраняемых узлов (зеленым)
        g.selectAll('.node-to-keep')
            .data(keptSubtree)
            .join('g')
            .attr('class', 'node-to-keep')
            .attr('transform', d => `translate(${d.y},${d.x})`)
            .append('circle')
            .attr('r', calculateNodeRadius) // Используем расчет размера узла
            .style('fill', d => {
                return d === selectedNode ? 'rgba(16, 185, 129, 0.8)' : 'rgba(59, 130, 246, 0.5)';
            })
            .style('stroke', d => {
                return d === selectedNode ? '#047857' : '#3b82f6';
            })
            .style('stroke-width', d => {
                return d === selectedNode ? 2 : 1; // Уменьшенная толщина
            });

        // Визуализация связей для сохраняемых узлов
        g.selectAll('.link-to-keep')
            .data(keptSubtree.filter(d => d.parent && isInSelectedSubtree(d.parent)))
            .join('path')
            .attr('class', 'link-to-keep')
            .attr('d', d => d3.linkHorizontal()
                .x(node => node.y)
                .y(node => node.x)({
                    source: d.parent,
                    target: d
                }))
            .style('fill', 'none')
            .style('stroke', '#3b82f6')
            .style('stroke-width', 1); // Уменьшенная толщина

        // Добавляем корону для выбранного узла (уменьшенная)
        const selectedNodeGroup = g.selectAll('.selected-node')
            .data([selectedNode])
            .join('g')
            .attr('class', 'selected-node')
            .attr('transform', d => `translate(${d.y},${d.x})`);

        // Корона для будущего корня (уменьшенная)
        selectedNodeGroup.append('path')
            .attr('class', 'crown')
            .attr('d', 'M0,-15 L5,-5 L15,-10 L10,0 L15,10 L5,5 L0,15 L-5,5 L-15,10 L-10,0 L-15,-10 L-5,-5 Z')
            .attr('fill', 'rgba(250, 204, 21, 0.7)')
            .attr('stroke', '#ca8a04')
            .attr('stroke-width', 0.5) // Уменьшенная толщина
            .attr('transform', 'scale(0.4)') // Уменьшенный размер
            .style('opacity', 0);

        // Получаем позиции узлов
        const rootPosition = {x: previousNodes[0].x, y: previousNodes[0].y};
        const selectedPosition = {x: selectedNode.x, y: selectedNode.y};

        // Добавляем текст "New Root", который будет перемещаться от старого корня к новому
        // Создаем группу для текста "New Root" и начинаем её у старого корня
        const newRootTextGroup = g.append('g')
            .attr('class', 'new-root-text')
            .attr('transform', `translate(${rootPosition.y},${rootPosition.x})`)
            .style('opacity', 0);

        // Добавляем текст "New Root" в группу
        newRootTextGroup.append('text')
            .attr('x', 15)
            .attr('y', 0)
            .attr('text-anchor', 'start')
            .attr('dominant-baseline', 'middle')
            .attr('font-size', '16px')
            .attr('font-weight', 'bold')
            .attr('fill', '#047857')
            .text('Новый корень');

        // Функция анимации текста "New Root" от старого корня к новому корню
        const animateNewRootText = () => {
            // Если выбранный узел и есть корень, то аннотация не нужна
            if (selectedNode === previousNodes[0]) {
                newRootTextGroup.remove();
                return;
            }

            // Сначала делаем текст видимым
            newRootTextGroup
                .transition()
                .duration(500)
                .style('opacity', 1)
                // Затем перемещаем его к выбранному узлу
                .transition()
                .delay(800)
                .duration(1200)
                .attr('transform', `translate(${selectedPosition.y},${selectedPosition.x})`);
        };

        // Стрелка и линия от корня к новому корню
        if (selectedNode !== previousNodes[0]) {
            // Добавляем зеленую линию соединения между корнями
            const rootLine = g.append('path')
                .attr('class', 'root-connection')
                .attr('d', () => {
                    // Прямая линия между корнями
                    return `M${rootPosition.y},${rootPosition.x} L${selectedPosition.y},${selectedPosition.x}`;
                })
                .style('fill', 'none')
                .style('stroke', '#047857')  // Зеленая линия
                .style('stroke-width', 2)
                .style('stroke-dasharray', '5,3')
                .style('opacity', 0);

            // Анимируем появление линии
            const animateConnection = () => {
                rootLine
                    .transition()
                    .delay(600)
                    .duration(800)
                    .style('opacity', 1);
            };

            // Создаем изогнутую стрелку от корня к выбранному узлу
            const arrow = g.append('g').attr('class', 'root-arrow');

            // Путь стрелки
            const arrowPath = arrow.append('path')
                .attr('d', () => {
                    // Создаем путь с помощью кривой Безье
                    const sourceX = rootPosition.y; // Корень - начало
                    const sourceY = rootPosition.x;
                    const targetX = selectedPosition.y; // Выбранный узел - конец
                    const targetY = selectedPosition.x;

                    const midX = (sourceX + targetX) / 2;
                    const midY = (sourceY + targetY) / 2 - 40; // Изгиб

                    return `M${sourceX},${sourceY} Q${midX},${midY} ${targetX},${targetY}`;
                })
                .style('fill', 'none')
                .style('stroke', '#047857')
                .style('stroke-width', 2)
                .style('stroke-dasharray', '5,3')
                .style('opacity', 0);

            // Наконечник стрелки - на конце (у выбранного узла)
            const arrowhead = arrow.append('polygon')
                .attr('points', '0,-3 6,0 0,3')
                .attr('fill', '#047857')
                .attr('transform', `translate(${selectedPosition.y},${selectedPosition.x}) rotate(90)`)
                .style('opacity', 0);

            // Функция для запуска анимации стрелки
            const animateArrow = () => {
                arrowPath
                    .transition()
                    .delay(800)
                    .duration(600)
                    .style('opacity', 1);

                arrowhead
                    .transition()
                    .delay(1400)
                    .duration(300)
                    .style('opacity', 1);
            };

            // Сохраняем для возможного перезапуска
            animationRef.current = {
                ...animationRef.current,
                animateArrow,
                animateConnection
            };

            // Запускаем анимацию соединения
            animateConnection();
        }

        // Анимация затухания отсекаемых узлов
        const animateNodeRemoval = () => {
            g.selectAll('.node-to-remove circle')
                .transition()
                .delay(800)
                .duration(1200)
                .style('opacity', 0)
                .attr('r', 0);

            g.selectAll('.link-to-remove')
                .transition()
                .delay(800)
                .duration(1200)
                .style('opacity', 0)
                .style('stroke-width', 0);
        };

        // Анимация перемещения текста
        const animateNodeToRoot = () => {
            if (selectedNode === previousNodes[0]) return; // Уже корень

            // Показываем корону
            selectedNodeGroup.select('.crown')
                .transition()
                .duration(500)
                .style('opacity', 1);

            // Добавляем подсветку выбранного узла
            selectedNodeGroup.select('circle')
                .transition()
                .delay(1400)
                .duration(600)
                .style('fill', 'rgba(16, 185, 129, 1)')
                .style('stroke-width', 2.5)
                .transition()
                .duration(400)
                .style('fill', 'rgba(16, 185, 129, 0.8)')
                .style('stroke-width', 2);
        };

        // Сохраняем функции анимации для возможности перезапуска
        animationRef.current = {
            ...animationRef.current,
            animateNodeRemoval,
            animateNodeToRoot,
            animateNewRootText
        };

        // Запускаем все анимации
        animateNodeRemoval();
        animateNodeToRoot();
        animateNewRootText();

        // Запускаем таймер для отображения прогресса
        startTimeRef.current = Date.now();
        elapsedTimeRef.current = 0;

        timerRef.current = setInterval(() => {
            const elapsed = Date.now() - startTimeRef.current;
            const newProgress = Math.min(1, elapsed / duration);
            elapsedTimeRef.current = elapsed;
            setProgress(newProgress);

            if (newProgress >= 1) {
                clearInterval(timerRef.current);
                timerRef.current = null;
                // Явно устанавливаем прогресс в 100%
                setProgress(1);
            }
        }, 50);
    };

    // Инициализация визуализации при первом рендере
    useEffect(() => {
        // Очищаем все существующие таймеры и анимации при пересоздании компонента
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }

        // Сбрасываем состояние анимации
        setProgress(0);
        elapsedTimeRef.current = 0;

        if (!previousTree || !nextTree || !svgRef.current) {
            onTransitionComplete();
            return;
        }

        const svg = d3.select(svgRef.current);
        svg.selectAll("*").remove();

        initializeVisualization(svg, previousTree, nextTree);

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
            stopAllD3Animations();
        };
    }, [previousTree, nextTree, duration, onTransitionComplete]);

    return (
        <div className="absolute inset-0 bg-white flex items-center justify-center">
            {/* Левая панель с информацией - теперь абсолютно позиционирована */}
            <div
                className="absolute left-0 top-0 z-10 w-1/4 max-w-xs h-full bg-gray-50 shadow-lg overflow-auto flex flex-col p-4">
                {/* Элементы управления анимацией (перемещены наверх) */}
                <div className="bg-white p-3 rounded-lg shadow mb-4">
                    <div className="flex justify-between gap-2 mb-2">
                        <button
                            className="flex-1 px-3 py-1 bg-blue-500 text-white rounded font-medium text-sm hover:bg-blue-600"
                            onClick={handleRestart}
                            title="Перезапустить анимацию с начала"
                        >
                            Заново
                        </button>

                        <button
                            className={`flex-1 px-3 py-1 rounded font-medium text-sm ${
                                progress >= 1
                                    ? 'bg-green-600 text-white hover:bg-green-700'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            }`}
                            onClick={handleContinue}
                            disabled={progress < 1}
                            title="Продолжить к следующему шагу"
                        >
                            Продолжить →
                        </button>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Ход {currentTurn + 1} → Ход {nextTurn + 1}</span>
                        <span>Прогресс: {Math.round(progress * 100)}%</span>
                    </div>

                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-1">
                        <div
                            className="bg-green-500 h-full transition-all duration-100 ease-out"
                            style={{width: `${progress * 100}%`}}
                        ></div>
                    </div>
                </div>

                <h2 className="text-lg font-bold mb-2 text-gray-800">Обрезка дерева</h2>

                <div className="bg-white p-3 rounded-lg shadow mb-4">
                    <h3 className="text-base font-bold mb-2 text-green-700">Новый корневой узел</h3>
                    <div className="mb-3">
                        <div className="text-sm font-semibold mb-1">ID:</div>
                        <div
                            className="bg-gray-100 p-2 rounded text-sm font-mono overflow-auto whitespace-normal break-all mb-2"
                            id="node-id-text">
                            {selectedNodeInfo.id}
                        </div>

                        <div className="text-sm font-semibold mb-1">Состояние:</div>
                        <div
                            className="bg-gray-100 p-2 rounded text-sm font-mono overflow-auto whitespace-normal break-all mb-2"
                            id="node-state-text">
                            {selectedNodeInfo.state}
                        </div>

                        <div className="text-sm font-semibold mb-1">Посещений:</div>
                        <div className="bg-gray-100 p-2 rounded text-sm mb-2" id="node-visits-text">
                            {selectedNodeInfo.visits}
                        </div>
                    </div>

                    <div className="flex justify-end mt-1">
                        <button
                            className="text-blue-600 text-xs underline mr-2"
                            onClick={() => {
                                navigator.clipboard.writeText(selectedNodeInfo.id);
                                alert('ID узла скопирован в буфер обмена!');
                            }}
                        >
                            Копировать ID
                        </button>
                        <button
                            className="text-blue-600 text-xs underline"
                            onClick={() => {
                                navigator.clipboard.writeText(selectedNodeInfo.state);
                                alert('Состояние узла скопировано в буфер обмена!');
                            }}
                        >
                            Копировать состояние
                        </button>
                    </div>
                </div>

                <div className="mt-auto text-xs text-gray-500 text-center bg-white p-2 rounded-lg shadow">
                    <p>Используйте колесо мыши для масштабирования и перетаскивание для панорамирования</p>
                    <p className="mt-1">Текущий масштаб: {Math.round(zoomScale * 100)}%</p>
                </div>
            </div>

            {/* SVG для визуализации занимает весь доступный контейнер */}
            <svg
                ref={svgRef}
                className="w-full h-full max-h-screen"
            />
        </div>
    );
};

export default TreeTransition;