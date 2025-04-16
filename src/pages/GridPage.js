// src/pages/GridPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JsonGrid from '../components/grid/JsonGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { findNodeByPath, parsePathFromUrl } from '../utils/gridUtils';

const GridPage = ({ pathMode = false }) => {
  const { nodeId, nodePath } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState(['root']);
  const [selectedNode, setSelectedNode] = useState(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Приоритет загрузки:
        // 1. Стандартное хранилище treeData
        // 2. Временное хранилище currentTreeData
        // 3. Пробуем найти другие ключи с данными
        let treeData = localStorage.getItem('treeData');
        
        // Если основное хранилище пусто, проверяем альтернативы
        if (!treeData) {
          treeData = localStorage.getItem('currentTreeData');
        }
        
        // В крайнем случае ищем любые JSON данные дерева
        if (!treeData) {
          // Перебираем все ключи в localStorage и ищем данные в формате JSON
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.includes('tree') || key.includes('Tree'))) {
              try {
                const value = localStorage.getItem(key);
                // Пробуем разобрать как JSON
                const parsed = JSON.parse(value);
                // Проверяем, похоже ли это на дерево (наличие children или state)
                if (parsed && (parsed.children || parsed.state)) {
                  treeData = value;
                  console.log(`Found tree data in localStorage key: ${key}`);
                  break;
                }
              } catch (e) {
                // Игнорируем ошибки парсинга
                console.warn(`Failed to parse localStorage item with key: ${key}`);
              }
            }
          }
        }
        
        if (!treeData) {
          setError('No tree data available. Please upload a file first or return to the tree view.');
          return;
        }
        
        // Пытаемся разобрать данные
        let parsedData;
        try {
          parsedData = JSON.parse(treeData);
          console.log("Successfully parsed tree data:", parsedData);
        } catch (e) {
          setError(`Invalid tree data format: ${e.message}`);
          console.error("Failed to parse tree data:", e);
          return;
        }
        
        // Проверяем, что данные имеют правильную структуру
        if (!parsedData || (typeof parsedData !== 'object')) {
          setError('Tree data has invalid format');
          return;
        }
        
        // Всегда отображаем все дерево
        setData(parsedData);
        
        // Проверяем, используем ли режим пути или ID
        if (pathMode && nodePath) {
          // Режим пути - используем индексы
          const path = parsePathFromUrl(nodePath);
          console.log("Parsed node path:", path);
          
          // Используем улучшенную функцию поиска для обработки различных форматов данных
          const foundNode = findNodeByDeepSearch(parsedData, path);
          
          if (foundNode) {
            console.log('Found node by path:', foundNode);
            
            // Убедимся, что у узла есть все необходимые поля
            if (!foundNode.id && foundNode.data?.id) {
              foundNode.id = foundNode.data.id;
            }
            
            if (typeof foundNode.depth === 'undefined' && path) {
              foundNode.depth = path.length; // Устанавливаем глубину на основе пути
            }
            
            // Сохраняем ссылку на найденный узел для отображения дополнительной информации
            setSelectedNode(foundNode);
            
            // Создаем пути для автоматического разворачивания
            // Формируем путь в JSON для автоматического разворачивания узлов
            const expandPaths = ['root'];
            
            // Добавляем путь для каждого уровня вложенности
            let currentPath = 'root.children';
            for (const index of path) {
              expandPaths.push(currentPath);
              currentPath += `[${index}]`;
              expandPaths.push(currentPath);
              currentPath += '.children';
            }
            
            setExpandedPaths(expandPaths);
            
            // Добавляем функцию для автоматического скролла к узлу
            setTimeout(() => {
              // Ищем элемент по ID или нескольким альтернативным селекторам
              let element = document.getElementById(`node-path-${nodePath}`);
              
              // Если не нашли по ID, пытаемся найти другими способами
              if (!element) {
                const lastIndex = path[path.length - 1];
                element = document.querySelector(`[data-node-index="${lastIndex}"]`);
              }
              
              if (!element) {
                // Ищем по содержимому state или ID узла
                const stateString = foundNode.state || '';
                const idString = foundNode.id || '';
                const elements = Array.from(document.querySelectorAll('.json-grid td'));
                
                element = elements.find(el => 
                  el.textContent.includes(stateString) || 
                  el.textContent.includes(idString)
                )?.parentElement;
              }
              
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Добавляем подсветку
                element.classList.add('bg-yellow-100');
                setTimeout(() => {
                  element.classList.remove('bg-yellow-100');
                  element.classList.add('bg-yellow-50');
                }, 1000);
              } else {
                console.warn("Could not find node element to scroll to");
              }
            }, 500);
          } else {
            setError(`Node at path "${nodePath}" not found. It's possible the path format doesn't match the tree structure.`);
          }
        } else if (nodeId) {
          // Реализуем поиск узла по ID
          const findNodeById = (node, id) => {
            if (!node) return null;
            
            // Проверяем ID текущего узла
            if (node.id === id || node.data?.id === id) {
              return node;
            }
            
            // Рекурсивно проверяем всех детей
            if (node.children && Array.isArray(node.children)) {
              for (const child of node.children) {
                const found = findNodeById(child, id);
                if (found) return found;
              }
            }
            
            return null;
          };
          
          const foundNode = findNodeById(parsedData, nodeId);
          
          if (foundNode) {
            console.log('Found node by ID:', foundNode);
            setSelectedNode(foundNode);
            // Разворачиваем пути (реализация сложнее, поэтому просто разворачиваем корень)
            setExpandedPaths(['root']);
          } else {
            setError(`Node with ID "${nodeId}" not found`);
          }
        } else {
          // Если ничего не указано, просто отображаем все дерево
          setExpandedPaths(['root']);
        }
      } catch (err) {
        setError(`Failed to load tree data: ${err.message}`);
        console.error('Error loading tree data:', err);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [nodeId, nodePath, pathMode]);

  // Улучшенная функция для поиска узла по пути
  // Проверяет разные структуры данных и более устойчива
  const findNodeByDeepSearch = (rootNode, path) => {
    if (!rootNode || !path || path.length === 0) return rootNode;
    
    console.log("Starting deep search for node with path:", path);
    
    // Проверяем, имеет ли rootNode поле data
    // (это может произойти, если мы передали d3.hierarchy узел вместо обычного узла)
    const dataNode = rootNode.data ? rootNode.data : rootNode;
    
    try {
      return findNodeByPath(dataNode, path);
    } catch (error) {
      console.error("Error in standard findNodeByPath:", error);
      
      // Если стандартная функция не справилась, попробуем ручной поиск
      let current = dataNode;
      
      for (const index of path) {
        console.log(`Looking for child at index ${index} in:`, current);
        
        if (!current.children || !Array.isArray(current.children) || index >= current.children.length) {
          console.error(`Cannot find child at index ${index}`);
          return null;
        }
        
        current = current.children[index];
      }
      
      return current;
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-4 px-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900" onClick={() => navigate('/')}>
            Game Tree Visualization
          </h1>
          <div className="flex space-x-4">
            <Button 
              onClick={handleBack}
              variant="secondary"
            >
              Back to Tree
            </Button>
            
            {selectedNode && (
              <Button
                onClick={() => {
                  // Сбросить выбранный узел и отобразить все дерево
                  setSelectedNode(null);
                  setExpandedPaths(['root']);
                  navigate('/grid');
                }}
                variant="secondary"
              >
                Reset View
              </Button>
            )}
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto py-6 px-4">
        {error && (
          <div className="mb-4">
            <ErrorMessage message={error} />
          </div>
        )}
        
        {selectedNode && (
          <Card className="mb-4 p-4">
            <div className="text-blue-700 font-medium">
              <div className="text-lg mb-2">Selected Node</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                {selectedNode.id && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">ID:</span> <span className="font-mono">{selectedNode.id}</span>
                  </div>
                )}
                
                {typeof selectedNode.depth !== 'undefined' && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Depth:</span> <span className="font-mono">{selectedNode.depth}</span>
                  </div>
                )}
                
                {selectedNode.state && (
                  <div className="col-span-2 text-sm text-gray-600">
                    <span className="font-semibold">State:</span> <span className="font-mono">{selectedNode.state}</span>
                  </div>
                )}
                
                {selectedNode.statistics && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Visits:</span> <span className="font-mono">{selectedNode.statistics.numVisits || 0}</span>
                  </div>
                )}
                
                {selectedNode.statistics && typeof selectedNode.statistics.relativeVisits !== 'undefined' && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Relative:</span> <span className="font-mono">{selectedNode.statistics.relativeVisits.toFixed(2)}%</span>
                  </div>
                )}
                
                {selectedNode.children && (
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">Children:</span> <span className="font-mono">{selectedNode.children.length}</span>
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <Card className="p-0 overflow-hidden max-h-[calc(100vh-200px)]">
          {data ? (
            <div className="overflow-auto h-full">
              <JsonGrid 
                data={data} 
                initialExpandedPaths={expandedPaths}
                selectedNodePath={nodePath}
              />
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No data available
            </div>
          )}
        </Card>
      </main>
    </div>
  );
};

export default GridPage;