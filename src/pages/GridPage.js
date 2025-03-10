// src/pages/GridPage.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JsonGrid from '../components/grid/JsonGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { ErrorMessage } from '../components/common/ErrorMessage';
import Card from '../components/common/Card';
import { getNodeIdentifier } from '../utils/treeUtils';
import { findNodeByPath, parsePathFromUrl } from '../utils/gridUtils';

const GridPage  = ({ pathMode = false }) => {
    const { nodeId, nodePath } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedPaths, setExpandedPaths] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);

  // В GridPage.js - в useEffect
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Загружаем данные из localStorage
        const storedData = localStorage.getItem('treeData');
        if (!storedData) {
          setError('No tree data available. Please upload a file first.');
          return;
        }
        
        const parsedData = JSON.parse(storedData);
        // Всегда отображаем все дерево
        setData(parsedData);
        
        // Проверяем, используем ли режим пути или ID
        if (pathMode && nodePath) {
          // Режим пути - используем индексы
          const path = parsePathFromUrl(nodePath);
          const foundNode = findNodeByPath(parsedData, path);
          
          if (foundNode) {
            console.log('Found node by path:', foundNode);
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
              const element = document.getElementById(`node-path-${nodePath}`);
              if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                // Добавляем подсветку
                element.classList.add('bg-yellow-100');
                setTimeout(() => {
                  element.classList.remove('bg-yellow-100');
                  element.classList.add('bg-yellow-50');
                }, 1000);
              }
            }, 500);
          } else {
            setError(`Node at path "${nodePath}" not found.`);
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

  // Функция для рекурсивного поиска узла по ID
  // Функция для рекурсивного поиска узла по ID
const findNodeById = (node, targetId, currentPath = [], paths = []) => {
    if (!node) return { node: null, paths: [] };
    
    // Проверяем наличие поля id непосредственно в узле
    const directId = node.id || '';
    if (directId === targetId) {
      return { node, paths };
    }
    
    // Проверяем наличие поля id в data
    const dataId = node.data?.id || '';
    if (dataId === targetId) {
      return { node, paths };
    }
    
    // Генерируем идентификатор и сравниваем
    try {
      const generatedId = getNodeIdentifier(node);
      if (generatedId === targetId) {
        return { node, paths };
      }
    } catch (error) {
      console.error('Error generating node ID:', error);
    }
    
    // Добавляем вспомогательную проверку по состоянию узла
    if (node.state && targetId.includes(node.state.substring(0, 10))) {
      console.log('Found potential match by state:', node.state);
      return { node, paths };
    }
    
    // Рекурсивно проверяем детей
    if (node.children && node.children.length > 0) {
      paths.push(`${currentPath.length ? currentPath.join('.') + '.' : ''}children`);
      
      for (let i = 0; i < node.children.length; i++) {
        const childPath = [...currentPath, 'children', `[${i}]`];
        const result = findNodeById(node.children[i], targetId, childPath, [...paths]);
        if (result.node) return result;
      }
    }
    
    return { node: null, paths: [] };
  };

  const handleBack = () => {
    navigate('/tree');
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
          <h1 className="text-2xl font-bold text-gray-900">
            Game Tree Grid View
          </h1>
          <div className="flex space-x-4">
            <button
              onClick={() => navigate('/tree')}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              Back to Tree View
            </button>
            
            {selectedNode && (
              <button
                onClick={() => {
                  // Сбросить выбранный узел и отобразить все дерево
                  setSelectedNode(null);
                  setExpandedPaths(['root']);
                  navigate('/grid');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Reset View
              </button>
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
      <div>Selected Node</div>
      {selectedNode.state && (
        <div className="mt-2 text-sm text-gray-600">
          State: <span className="font-mono">{selectedNode.state}</span>
        </div>
      )}
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