// src/components/iteration/SelectionStage.js
import React from 'react';
import Card from '../common/Card';

const SelectionStage = ({ data }) => {
    if (!data) {
        return <div className="text-center py-8 text-gray-500">No selection data available</div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-blue-800 mb-2">Selection Stage</h2>
                <p className="text-gray-600">
                    In the selection stage, the algorithm traverses the tree from the root node, choosing 
                    child nodes based on the UCB formula until reaching a leaf node or a node that can be expanded.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Selection Path</h3>
                    <p className="text-sm text-gray-500 mb-3">
                        Path from root to the selected node: {data.path?.length || 0} nodes
                    </p>
                    
                    <div className="border rounded-lg overflow-auto max-h-96">
                        {data.path && data.path.length > 0 ? (
                            <div className="divide-y">
                                {data.path.map((node, index) => (
                                    <div 
                                        key={index} 
                                        className={`p-3 ${
                                            index === data.path.length - 1 
                                                ? 'bg-blue-50' 
                                                : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                        }`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Node Depth: {index}</span>
                                            {node.statistics && (
                                                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                    Visits: {node.statistics.numVisits}
                                                </span>
                                            )}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1 truncate">
                                            State: {node.state ? node.state.substring(0, 50) + '...' : 'N/A'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500">No path data</div>
                        )}
                    </div>
                </Card>
                
                <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Selected Node</h3>
                    
                    {data.selectedNode ? (
                        <div className="space-y-4">
                            <div className="bg-blue-100 border border-blue-200 rounded-lg p-4">
                                <div className="font-medium text-blue-900">Final Selected Node</div>
                                <div className="mt-2 space-y-2">
                                    <div className="text-sm">
                                        <span className="font-medium">State:</span> 
                                        <div className="text-gray-600 mt-1 break-words">
                                            {data.selectedNode.state || 'N/A'}
                                        </div>
                                    </div>
                                    
                                    {data.selectedNode.statistics && (
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="font-medium">Visits:</span> 
                                                <span className="ml-1 text-gray-600">
                                                    {data.selectedNode.statistics.numVisits}
                                                </span>
                                            </div>
                                            
                                            <div>
                                                <span className="font-medium">Relative Visits:</span> 
                                                <span className="ml-1 text-gray-600">
                                                    {data.selectedNode.statistics.relativeVisits?.toFixed(2) || 0}%
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {data.selectedNode.children && (
                                        <div className="text-sm">
                                            <span className="font-medium">Children:</span> 
                                            <span className="ml-1 text-gray-600">
                                                {data.selectedNode.children.length || 0}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {data.selectedNode.statistics?.statisticsForActions?.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-medium mb-2">Action Statistics</h4>
                                    <div className="border rounded-lg overflow-auto max-h-64">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Uses</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {data.selectedNode.statistics.statisticsForActions.map((roleStat, i) => (
                                                    roleStat.actions.map((action, j) => (
                                                        <tr key={`${i}-${j}`}>
                                                            <td className="px-3 py-2 text-sm text-gray-500">{roleStat.role}</td>
                                                            <td className="px-3 py-2 text-sm font-mono text-gray-500">{action.action}</td>
                                                            <td className="px-3 py-2 text-sm text-gray-500">{action.averageActionScore.toFixed(2)}</td>
                                                            <td className="px-3 py-2 text-sm text-gray-500">{action.actionNumUsed}</td>
                                                        </tr>
                                                    ))
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">No selected node data</div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default SelectionStage;