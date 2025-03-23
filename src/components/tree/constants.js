// src/components/tree/constants.js
export const TREE_CONSTANTS = {
    // Состояния узлов
    NODE_STATES: {
        VISIBLE: 'visible',           // Обычный видимый узел
        EXPANDED: 'expanded',         // Узел, все дети которого показаны
        HAS_HIDDEN_CHILDREN: 'has_hidden_children',  // Узел со скрытыми детьми
        PARENT_HIDDEN: 'parent_hidden',  // Узел скрыт, т.к. скрыт родитель
        DEPTH_LIMITED: 'depth_limited',  // Узел скрыт из-за ограничения глубины
        FILTERED: 'filtered'          // Узел скрыт из-за фильтров
    },

    // Цвета
    COLORS: {
        STROKE: {
            NORMAL: '#2c5282',        // Синий для обычных узлов
            EXPANDED: '#047857',      // Зеленый для раскрытых узлов
            HAS_HIDDEN: '#dc2626',    // Красный для узлов со скрытыми детьми
            DEPTH_LIMITED: '#f59e0b', // Желтый для ограниченных по глубине
            FILTERED: '#7c3aed'       // Фиолетовый для отфильтрованных
        },
        FILL: {
            BASE: '#ffffff',          // Базовый цвет заливки
            HIGHLIGHT: '#f8fafc'      // Цвет при наведении
        },
        TEXT: {
            PRIMARY: '#1e293b',       // Основной цвет текста
            SECONDARY: '#1a365d',     // Более темный цвет для текста процентов
            ACCENT: '#3b82f6'         // Акцентный цвет текста
        },
        LINK: '#cbd5e0',              // Цвет связей
        NODE_NORMAL: '#3b82f6',       // Синий для обычных узлов
        NODE_HIDDEN: '#ef4444',       // Красный для узлов со скрытыми детьми
        NODE_LIMITED: '#f59e0b'       // Желтый для ограниченных узлов
    },

    // Размеры и отступы
    DIMENSIONS: {
        WIDTH: 2000,                  // Ширина SVG
        HEIGHT: 2500,                 // Высота SVG
        MARGIN: 50,                   // Внешний отступ
        PADDING: 250,                 // Внутренний отступ
        NODE: {
            MIN_RADIUS: 5,            // Минимальный радиус узла
            MAX_RADIUS: 20,           // Максимальный радиус узла
            TEXT_OFFSET: 16           // Отступ для текста
        }
    },

    // Стили линий и границ
    STYLE: {
        STROKE_WIDTH: {
            NORMAL: 1.5,              // Обычная толщина границы
            HIGHLIGHTED: 2.5,         // Толщина при выделении
            LINK: 1                   // Толщина линий связей
        },
        LINK_OPACITY: 0.4,           // Прозрачность линий связей
        NODE_OPACITY: {
            NORMAL: 1,                // Обычная прозрачность узла
            DIMMED: 0.7              // Приглушенная прозрачность
        }
    },

    // Настройки макета
    LAYOUT: {
        SEPARATION: {
            SIBLINGS: 3,              // Расстояние между родственными узлами
            NON_SIBLINGS: 4.5         // Расстояние между неродственными узлами
        },
        ZOOM: {
            MIN: 0.1,                 // Минимальный масштаб
            MAX: 4,                   // Максимальный масштаб
            DEFAULT: 0.6              // Масштаб по умолчанию
        }
    },

    // Анимации
    ANIMATION: {
        DURATION: 300,               // Длительность анимации в мс
        EASING: 'cubic-bezier(0.4, 0, 0.2, 1)' // Функция сглаживания
    }
};