// src/utils/gridUtils.js

/**
 * Улучшенная функция для поиска узла по пути от корня
 * @param {Object} root - Корневой узел
 * @param {Array<number>} path - Массив индексов для доступа к узлу
 * @returns {Object|null} - Найденный узел или null
 */
export const findNodeByPath = (root, path) => {
  if (!root || !path || path.length === 0) return root;
  
  console.log("Finding node by path:", path);
  
  try {
    let current = root;
    
    // Проходим по пути, используя индексы для доступа к детям
    for (const index of path) {
      if (!current.children || !Array.isArray(current.children) || index >= current.children.length) {
        console.warn(`Path error: Cannot find child at index ${index}. Available children: ${current.children?.length || 0}`);
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
 * Вычисляет путь к узлу от корня в дереве d3.hierarchy
 * Улучшенная версия с дополнительной проверкой идентичности узлов
 * @param {Object} node - Узел d3.hierarchy, для которого нужно вычислить путь
 * @returns {Array<number>} - Массив индексов
 */
export const calculateNodePath = (node) => {
  if (!node) return [];
  
  const path = [];
  let current = node;
  
  // Идем от узла к корню, запоминая индексы
  while (current.parent) {
    // Найдем индекс текущего узла среди детей родителя
    let index = -1;
    if (current.parent.children) {
      // Сначала попробуем найти по прямому сравнению
      index = current.parent.children.findIndex(child => child === current);
      
      // Если не нашли, попробуем сравнить по ID или state
      if (index === -1) {
        // Определим ID или state текущего узла
        const nodeId = current.id || current.data?.id;
        const nodeState = current.state || current.data?.state;
        
        index = current.parent.children.findIndex(child => {
          const childId = child.id || child.data?.id;
          const childState = child.state || child.data?.state;
          
          // Сравниваем по ID, если он есть
          if (nodeId && childId && nodeId === childId) {
            return true;
          }
          
          // Или по state, если он есть
          if (nodeState && childState && nodeState === childState) {
            return true;
          }
          
          // Или по hash содержимого
          return JSON.stringify(child) === JSON.stringify(current);
        });
      }
    }
    
    if (index === -1) {
      console.warn("Could not find node index among parent's children", current);
      
      // Крайний случай - берем любой доступный индекс
      if (current.parent.children && current.parent.children.length > 0) {
        console.warn("Using fallback: adding last available index");
        index = current.parent.children.length - 1;
      } else {
        break;
      }
    }
    
    // Добавляем индекс в начало пути
    path.unshift(index);
    current = current.parent;
  }
  
  console.log("Calculated path:", path);
  return path;
};

/**
 * Форматирует путь узла для использования в URL
 * @param {Array<number>} path - Путь узла
 * @returns {string} - Строка для URL
 */
export const formatPathForUrl = (path) => {
  if (!path || !Array.isArray(path) || path.length === 0) {
    return "0"; // Если путь пустой, возвращаем путь к корню
  }
  return path.join('-');
};

/**
 * Парсит путь узла из URL-параметра
 * @param {string} urlPath - Строка из URL
 * @returns {Array<number>} - Массив индексов
 */
export const parsePathFromUrl = (urlPath) => {
  if (!urlPath) return [];
  
  // Разбиваем строку по дефисам и преобразуем каждую часть в число
  const path = urlPath.split('-').map(index => {
    // Проверяем, что это действительно число
    const parsed = parseInt(index, 10);
    if (isNaN(parsed)) {
      console.warn(`Invalid path segment: ${index}`);
      return 0;
    }
    return parsed;
  });
  
  return path;
};