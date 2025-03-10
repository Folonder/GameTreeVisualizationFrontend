// src/utils/gridUtils.js

/**
 * Находит узел по его пути от корня (массиву индексов)
 * @param {Object} root - Корневой узел
 * @param {Array<number>} path - Массив индексов для доступа к узлу
 * @returns {Object|null} - Найденный узел или null
 */
export const findNodeByPath = (root, path) => {
    if (!root || !path || path.length === 0) return root;
    
    let current = root;
    
    try {
      for (const index of path) {
        if (!current.children || !current.children[index]) {
          return null;
        }
        current = current.children[index];
      }
      return current;
    } catch (error) {
      console.error('Error finding node by path:', error);
      return null;
    }
  };
  
  /**
   * Вычисляет путь к узлу от корня
   * @param {Object} node - Узел, для которого нужно вычислить путь
   * @returns {Array<number>} - Массив индексов
   */
  export const calculateNodePath = (node) => {
    const path = [];
    let current = node;
    
    while (current.parent) {
      const index = current.parent.children.indexOf(current);
      if (index === -1) break; // Если узел не найден в родителе
      path.unshift(index);
      current = current.parent;
    }
    
    return path;
  };
  
  /**
   * Форматирует путь узла для использования в URL
   * @param {Array<number>} path - Путь узла
   * @returns {string} - Строка для URL
   */
  export const formatPathForUrl = (path) => {
    return path.join('-');
  };
  
  /**
   * Парсит путь узла из URL-параметра
   * @param {string} urlPath - Строка из URL
   * @returns {Array<number>} - Массив индексов
   */
  export const parsePathFromUrl = (urlPath) => {
    if (!urlPath) return [];
    return urlPath.split('-').map(index => parseInt(index, 10));
  };