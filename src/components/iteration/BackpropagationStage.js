// src/components/iteration/BackpropagationStage.js
import React from 'react';
import Card from '../common/Card';

const BackpropagationStage = ({ data }) => {
    if (!data) {
        return <div className="text-center py-8 text-gray-500">No backpropagation data available</div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="bg-indigo-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-indigo-800 mb-2">Backpropagation Stage</h2>
                <p className="text-gray-600">
                    In the backpropagation stage, the results from the playout are propagated back up the tree, 
                    updating the statistics for each node along the selection path.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Propagation Path</h3>
                    <p className="text-sm text-gray-500 mb-3">
                        Nodes updated from leaf to root: {data.path?.length || 0} nodes
                    </p>
                    
                    <div className="border rounded-lg overflow-auto max-h-96">
                        {data.path && data.path.length > 0 ? (
                            <div className="divide-y">
                                {data.path.map((node, index) => (
                                    <div 
                                        key={index} 
                                        className={`p-3 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}
                                    >
                                        <div className="flex justify-between items-center">
                                            <span className="font-medium">Node {index + 1}</span>
                                            {node.statistics && (
                                                <span className="text-sm bg-indigo-100 text-indigo-800 px-2 py-1 rounded">
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
                    <h3 className="text-md font-medium mb-3">Propagated Results</h3>
                    
                    {data.results && Object.keys(data.results).length > 0 ? (
                        <div className="space-y-4">
                            <div className="border rounded-lg overflow-hidden">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {Object.entries(data.results).map(([role, score], index) => (
                                            <tr key={index}>
                                                <td className="px-4 py-3 text-sm text-gray-900 font-medium">{role}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {typeof score === 'number' ? score.toFixed(2) : score}
                                                        </span>
                                                        
                                                        {typeof score === 'number' && (
                                                            <div className="ml-4 w-32 bg-gray-200 rounded-full h-2.5">
                                                                <div 
                                                                    className="bg-indigo-600 h-2.5 rounded-full" 
                                                                    style={{ width: `${Math.min(100, Math.max(0, score))}%` }}
                                                                ></div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <h4 className="text-sm font-medium text-indigo-800 mb-2">How Backpropagation Works</h4>
                                <p className="text-sm text-gray-600">
                                    Each node in the path above has its statistics updated with these results.
                                    Visit counts are incremented and scores are accumulated. This helps the tree
                                    learn which moves lead to good outcomes over time.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">No results data</div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default BackpropagationStage;