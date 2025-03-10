// src/components/grid/JsonGrid.js
import React, { useState } from 'react';

const JsonGrid = ({ 
  data, 
  initialExpandedPaths = [], 
  selectedNodePath = null
}) => {
  const [expandedPaths, setExpandedPaths] = useState(
    initialExpandedPaths.reduce((acc, path) => {
      acc[path] = true;
      return acc;
    }, {})
  );

  const togglePath = (path) => {
    setExpandedPaths(prev => ({
      ...prev,
      [path]: !prev[path]
    }));
  };

  const renderValue = (value, path, nodePath = null) => {
    // Проверяем, является ли узел выбранным
    const isSelected = selectedNodePath && nodePath && selectedNodePath === nodePath;
    
    const valueType = typeof value;
    
    // Обработка null
    if (value === null) {
      return <span className="text-red-500 italic">null</span>;
    }
    
    // Обработка undefined
    if (value === undefined) {
      return <span className="text-red-500 italic">undefined</span>;
    }
    
    // Обработка массивов
    if (Array.isArray(value)) {
      return (
        <div className="border border-gray-200 rounded min-w-[400px]">
          <div 
            className={`cursor-pointer flex items-center p-2 border-b border-gray-200 ${isSelected ? 'bg-yellow-100' : 'bg-gray-50'}`}
            onClick={() => togglePath(path)}
            id={nodePath ? `node-path-${nodePath}` : ''}
          >
            <span className="text-xs font-bold mr-2 w-4 h-4 flex items-center justify-center border border-gray-300 rounded-full">
              {expandedPaths[path] ? '−' : '+'}
            </span>
            <span className="text-gray-700 font-medium">Array</span>
            <span className="text-gray-500 ml-2">({value.length} items)</span>
            {isSelected && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Selected Node</span>}
          </div>
          
          {expandedPaths[path] && (
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: '400px' }}>
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2 border-b border-gray-200 text-gray-600 text-xs font-medium w-16">Index</th>
                      <th className="text-left p-2 border-b border-gray-200 text-gray-600 text-xs font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {value.map((item, index) => (
                      <tr key={`${path}[${index}]`} className="border-b border-gray-200 last:border-b-0">
                        <td className="p-2 border-r border-gray-200 text-gray-500 text-xs w-16 whitespace-nowrap">[{index}]</td>
                        <td className="p-2">
                          {renderValue(item, `${path}[${index}]`, nodePath ? `${nodePath}-${index}` : `${index}`)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Обработка объектов
    if (valueType === 'object') {
      const entries = Object.entries(value);
      
      return (
        <div className="border border-gray-200 rounded min-w-[400px]">
          <div 
            className={`cursor-pointer flex items-center p-2 border-b border-gray-200 ${isSelected ? 'bg-yellow-100' : 'bg-gray-50'}`}
            onClick={() => togglePath(path)}
            id={nodePath ? `node-path-${nodePath}` : ''}
          >
            <span className="text-xs font-bold mr-2 w-4 h-4 flex items-center justify-center border border-gray-300 rounded-full">
              {expandedPaths[path] ? '−' : '+'}
            </span>
            <span className="text-gray-700 font-medium">Object</span>
            <span className="text-gray-500 ml-2">({entries.length} properties)</span>
            {isSelected && <span className="ml-2 text-xs bg-blue-500 text-white px-2 py-0.5 rounded">Selected Node</span>}
          </div>
          
          {expandedPaths[path] && (
            <div className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full border-collapse" style={{ minWidth: '400px' }}>
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="text-left p-2 border-b border-gray-200 text-gray-600 text-xs font-medium w-1/4 min-w-[150px]">Property</th>
                      <th className="text-left p-2 border-b border-gray-200 text-gray-600 text-xs font-medium">Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(([key, val]) => (
                      <tr key={`${path}.${key}`} className="border-b border-gray-200 last:border-b-0">
                        <td className="p-2 border-r border-gray-200 text-blue-600 font-medium w-1/4 min-w-[150px] whitespace-nowrap align-top">{key}</td>
                        <td className="p-2">
                          {key === 'children' && Array.isArray(val) 
                            ? renderValue(val, `${path}.${key}`, nodePath)
                            : renderValue(val, `${path}.${key}`, nodePath)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      );
    }
    
    // Обработка строк
    if (valueType === 'string') {
      return <span className="text-green-600 font-mono whitespace-normal break-words">"{value}"</span>;
    }
    
    // Обработка чисел
    if (valueType === 'number') {
      return <span className="text-purple-600 font-mono">{value}</span>;
    }
    
    // Обработка булевых значений
    if (valueType === 'boolean') {
      return <span className="text-orange-600 font-mono">{value.toString()}</span>;
    }
    
    // Обработка функций
    if (valueType === 'function') {
      return <span className="text-gray-500 italic">function</span>;
    }
    
    // Обработка других типов значений
    return <span className="whitespace-normal break-words">{String(value)}</span>;
  };

  return (
    <div className="json-grid bg-white rounded-lg shadow-sm overflow-auto text-sm border border-gray-300 max-h-[calc(100vh-220px)]">
      {renderValue(data, 'root', '')}
    </div>
  );
};

export default JsonGrid;