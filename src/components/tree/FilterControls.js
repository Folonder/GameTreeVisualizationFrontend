import React, { useState } from 'react';

const FilterControls = ({
    currentFilters,
    onApplyFilters,
    onResetFilters,
    maxDepth,
    totalNodes
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [draftFilters, setDraftFilters] = useState(currentFilters);

    const handleMaxDepthChange = (value) => {
        const maxDepth = value === '' ? null : Math.max(0, parseInt(value) || 0);
        setDraftFilters(prev => ({
            ...prev,
            maxDepth
        }));
    };

    const handleDepthFilterChange = (depth, value) => {
        const newDepthFilters = new Map(draftFilters.depthFilters);
        if (value === 0) {
            newDepthFilters.delete(depth);
        } else {
            newDepthFilters.set(depth, value);
        }
        setDraftFilters(prev => ({
            ...prev,
            depthFilters: newDepthFilters
        }));
    };

    const handleApply = () => {
        onApplyFilters(draftFilters);
        setIsOpen(false);
    };

    const handleReset = () => {
        onResetFilters();
        setDraftFilters({
            maxDepth: null,
            depthFilters: new Map(),
            isFiltersApplied: false
        });
        setIsOpen(false);
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded shadow"
            >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <span className="font-medium text-gray-700">Фильтры</span>
                {(draftFilters.depthFilters.size > 0 || draftFilters.maxDepth !== null) && (
                    <span className="ml-1 bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                        Активны
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute left-0 top-full mt-2 w-80 bg-white rounded shadow-lg z-10 p-4">
                    <div className="space-y-4">
                        {/* Ограничение глубины */}
                        <div>
                            <h3 className="text-sm font-medium text-gray-700 mb-2">Максимальная глубина</h3>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    min="0"
                                    max={maxDepth}
                                    value={draftFilters.maxDepth === null ? '' : draftFilters.maxDepth}
                                    onChange={(e) => handleMaxDepthChange(e.target.value)}
                                    placeholder="Без ограничений"
                                    className="w-20 px-2 py-1 border rounded text-sm"
                                />
                                <span className="text-sm text-gray-500">Уровень глубины (0-{maxDepth})</span>
                            </div>
                        </div>

                        {/* Фильтры по минимальному проценту */}
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-medium text-gray-700">Минимальный процент по уровням</h3>
                                <button
                                    onClick={() => setDraftFilters(prev => ({ ...prev, depthFilters: new Map() }))}
                                    className="text-xs text-gray-500 hover:text-gray-700"
                                >
                                    Очистить
                                </button>
                            </div>

                            <div className="text-xs text-gray-500 mb-2">
                                Скрывает узлы с процентом меньше порогового значения на каждом уровне.
                                Дочерние узлы скрытых узлов также будут скрыты.
                            </div>

                            <div className="max-h-48 overflow-y-auto space-y-2">
                                {Array.from({ length: maxDepth + 1 }, (_, depth) => (
                                    <div key={depth} className="flex items-center gap-2">
                                        <label className="text-sm text-gray-600 w-16">
                                            Уровень {depth}:
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={draftFilters.depthFilters.get(depth) || ''}
                                            onChange={(e) => handleDepthFilterChange(depth, parseInt(e.target.value) || 0)}
                                            placeholder="0%"
                                            className="w-16 px-2 py-1 border rounded text-sm"
                                        />
                                        <span className="text-sm text-gray-500">% мин</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Кнопки */}
                        <div className="flex justify-end gap-2 pt-2 border-t">
                            <button
                                onClick={handleReset}
                                className="px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded"
                            >
                                Сбросить
                            </button>
                            <button
                                onClick={handleApply}
                                className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                                Применить
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterControls;