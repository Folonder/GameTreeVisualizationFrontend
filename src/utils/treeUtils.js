import * as d3 from 'd3';
import { TREE_CONSTANTS } from './constants';

export function createTreeLayout(svg, data) {
    const width = svg.node().getBoundingClientRect().width;
    const height = svg.node().getBoundingClientRect().height;
    
    // Создаем иерархию данных
    const hierarchy = d3.hierarchy(data);
    
    // Создаем layout для дерева
    const treeLayout = d3.tree()
        .size([height - 40, width - 40]) // отступы
        .separation((a, b) => (a.parent === b.parent ? 1 : 2));
    
    // Применяем layout к данным
    const root = treeLayout(hierarchy);
    
    // Создаем группу для трансформации
    const g = svg.append('g')
        .attr('transform', 'translate(20,20)'); // отступы
    
    // Рисуем связи
    g.selectAll('.link')
        .data(root.links())
        .join('path')
        .attr('class', 'link')
        .attr('d', d3.linkHorizontal()
            .x(d => d.y)
            .y(d => d.x))
        .attr('fill', 'none')
        .attr('stroke', '#ccc');
    
    // Рисуем узлы
    const nodes = g.selectAll('.node')
        .data(root.descendants())
        .join('g')
        .attr('class', 'node')
        .attr('transform', d => `translate(${d.y},${d.x})`);
    
    // Добавляем круги для узлов
    nodes.append('circle')
        .attr('r', TREE_CONSTANTS.NODE_RADIUS)
        .attr('fill', 'white')
        .attr('stroke', 'steelblue');
    
    // Добавляем текст с количеством посещений
    nodes.append('text')
        .attr('dy', '0.31em')
        .attr('x', d => d.children ? -6 : 6)
        .attr('text-anchor', d => d.children ? 'end' : 'start')
        .text(d => d.data.statistics?.numVisits || 0)
        .attr('font-size', '12px');
}