import React, { useState } from 'react';

const DepthFilterControls = ({ maxDepth, onFiltersChange }) => {
    const [filters, setFilters] = useState(new Map());
    const [isOpen, setIsOpen] = useState(false);

    const handleFilterChange = (depth, value) => {
        const numValue = Math.max(0, Math.min(100, Number(value)));
        const newFilters = new Map(filters);
        
        if (numValue === 0) {
            newFilters.delete(depth);
        } else {
            newFilters.set(depth, numValue);
        }
        
        setFilters(newFilters);
        onFiltersChange(newFilters);
    };

    const clearFilters = () => {
        setFilters(new Map());
        onFiltersChange(new Map());
    };

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded border"
            >
                <span>Depth Filters</span>
                {filters.size > 0 && (
                    <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                        {filters.size}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-2 bg-white rounded shadow-lg border p-4 min-w-[300px]">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium">Filter by Depth (min %)</h3>
                        <button
                            onClick={clearFilters}
                            className="text-sm text-gray-500 hover:text-gray-700"
                        >
                            Clear all
                        </button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-auto">
                        {Array.from({ length: maxDepth + 1 }, (_, depth) => (
                            <div key={depth} className="flex items-center gap-4">
                                <label className="text-sm w-24">
                                    Depth {depth}:
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={filters.get(depth) || ''}
                                    onChange={(e) => handleFilterChange(depth, e.target.value)}
                                    placeholder="0"
                                    className="w-20 px-2 py-1 border rounded text-sm"
                                />
                                <span className="text-sm text-gray-500">%</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default DepthFilterControls;