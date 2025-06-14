// src/components/tree/constants.js
export const TREE_CONSTANTS = {
    // Состояния узлов
    NODE_STATES: {
        VISIBLE: 'visible',           // Обычный видимый узел
        EXPANDED: 'expanded',         // Узел, все дети которого показаны
        HAS_HIDDEN_CHILDREN: 'has_hidden_children',  // Узел со скрытыми детьми
        PARENT_HIDDEN: 'parent_hidden',  // Узел скрыт, т.к. скрыт родитель
        DEPTH_LIMITED: 'depth_limited',  // Узел скрыт из-за ограничения глубины
        FILTERED: 'filtered',          // Узел скрыт из-за фильтров
        PLAYOUT: 'playout'
    },

    // Цвета - добавлены цвета для изменений
    COLORS: {
        STROKE: {
            NORMAL: '#2c5282',        // Синий для обычных узлов
            EXPANDED: '#047857',      // Зеленый для раскрытых узлов
            HAS_HIDDEN: '#dc2626',    // Красный для узлов со скрытыми детьми
            DEPTH_LIMITED: '#f59e0b', // Желтый для ограниченных по глубине
            FILTERED: '#7c3aed',       // Фиолетовый для отфильтрованных
            PLAYOUT: '#9333ea'  
        },
        FILL: {
            BASE: '#ffffff',          // Базовый цвет заливки
            HIGHLIGHT: '#f8fafc',     // Цвет при наведении
            NEW_NODE: '#b9f6ca',      // Светло-зеленый для новых узлов
            UPDATED_NODE: '#bbdefb',   // Светло-синий для обновленных узлов
            PLAYOUT: '#e9d5ff'
        },
        TEXT: {
            PRIMARY: '#1e293b',       // Основной цвет текста
            SECONDARY: '#1a365d',     // Более темный цвет для текста процентов
            ACCENT: '#3b82f6',        // Акцентный цвет текста
            NEW_LABEL: '#ffffff',     // Белый для текста меток "NEW"
            CHANGE_LABEL: '#ffffff'   // Белый для текста меток "+N"
        },
        LABEL_BG: {
            NEW: '#388e3c',           // Темно-зеленый фон для метки "NEW"
            CHANGE: '#1976d2'         // Темно-синий фон для меток "+N"
        },
        LINK: '#4a5568',              // Цвет связей
        NODE_NORMAL: '#3b82f6',       // Синий для обычных узлов
        NODE_HIDDEN: '#ef4444',       // Красный для узлов со скрытыми детьми
        NODE_LIMITED: '#f59e0b',      // Желтый для ограниченных узлов
        NEW_NODE: '#4caf50',          // Зеленый для новых узлов
        UPDATED_NODE: '#2196f3'       // Синий для обновленных узлов
    },

    // Размеры и отступы
    DIMENSIONS: {
        WIDTH: 2000,                  // Ширина SVG
        HEIGHT: 2500,                 // Высота SVG
        MARGIN: 50,                   // Внешний отступ
        PADDING: 200,                 // Внутренний отступ
        NODE: {
            MIN_RADIUS: 6,            // Минимальный радиус узла
            MAX_RADIUS: 22,           // Максимальный радиус узла
            TEXT_OFFSET: 16           // Отступ для текста
        },
        LABEL: {
            HEIGHT: 18,               // Высота фона метки
            NEW_WIDTH: 36,            // Ширина фона метки "NEW"
            PADDING: 3                // Отступ метки от узла
        }
    },

    // Стили линий и границ
    STYLE: {
        STROKE_WIDTH: {
            NORMAL: 1.5,              // Обычная толщина границы
            HIGHLIGHTED: 2.5,         // Толщина при выделении
            LINK: 5,                // Толщина линий связей
            NEW_NODE: 4.0,            // Толщина границы новых узлов
            UPDATED_NODE: 3.0         // Толщина границы обновленных узлов
        },
        LINK_OPACITY: 0.85,            // Прозрачность линий связей
        NODE_OPACITY: {
            NORMAL: 1,                // Обычная прозрачность узла
            DIMMED: 0.7,              // Приглушенная прозрачность
            NEW_NODE: 0.9,            // Прозрачность новых узлов
            UPDATED_NODE: 0.8         // Прозрачность обновленных узлов
        },
        LABEL: {
            FONT_SIZE: 12,            // Основной размер шрифта меток
            FONT_SIZE_SMALL: 10,      // Уменьшенный размер шрифта меток
            BORDER_RADIUS: 4,         // Скругление углов фона меток
            OPACITY: 0.9              // Прозрачность фона меток
        }
    },

    // Настройки макета
    LAYOUT: {
        SEPARATION: {
            SIBLINGS: 2.5,            // Расстояние между родственными узлами
            NON_SIBLINGS: 3.5         // Расстояние между неродственными узлами
        },
        ZOOM: {
            MIN: 0.1,                 // Минимальный масштаб
            MAX: 5,                   // Максимальный масштаб
            DEFAULT: 0.7              // Масштаб по умолчанию
        }
    },

    // Анимации
    ANIMATION: {
        DURATION: 300,                // Длительность анимации в мс
        EASING: 'cubic-bezier(0.4, 0, 0.2, 1)', // Функция сглаживания
        PULSE: {
            DURATION: 700,            // Длительность одной пульсации
            SCALE_START: 1.3,         // Начальный масштаб пульсации
            SCALE_MID: 0.9,           // Промежуточный масштаб
            SCALE_END: 1.1            // Конечный масштаб
        }
    },
    
    // Константы для адаптивного масштабирования
    ADAPTIVE_SCALING: {
        TINY_TREE: {
            NODE_COUNT: 20,           // Порог для очень маленьких деревьев
            DEPTH: 2,                 // Максимальная глубина для очень маленьких деревьев
            SCALE: 2.5,               // Множитель масштаба для очень маленьких деревьев
            SPACING: 0.7,             // Множитель расстояния для очень маленьких деревьев
            INITIAL_NODE_SIZE: 0.8    // Начальный размер узлов (доля от MAX_RADIUS)
        },
        SMALL_TREE: {
            NODE_COUNT: 50,           // Порог для маленьких деревьев
            DEPTH: 3,                 // Максимальная глубина для маленьких деревьев
            SCALE: 1.8,               // Множитель масштаба для маленьких деревьев
            SPACING: 0.9,             // Множитель расстояния для маленьких деревьев
            INITIAL_NODE_SIZE: 0.7    // Начальный размер узлов (доля от MAX_RADIUS)
        },
        // Пороговые значения для изменения размеров узлов
        VISITS_THRESHOLD: {
            INITIAL_LARGE: 10,        // Если макс. кол-во посещений меньше этого, все узлы крупные
            NEW_NODE: 2,              // Узлы с посещениями меньше этого значения считаются "новыми"
            SCALING_POWER: 0.33       // Показатель степени для нелинейного масштабирования
        },
        LINK_SCALING: {
            TINY_TREE_MULTIPLIER: 1.5,
            SMALL_TREE_MULTIPLIER: 1.3, 
            LARGE_TREE_MULTIPLIER: 0.8
        }
    }
};