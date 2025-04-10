// src/components/iteration/PlayoutStage.js
import React from 'react';
import Card from '../common/Card';

const PlayoutStage = ({ data }) => {
    if (!data) {
        return <div className="text-center py-8 text-gray-500">No playout data available</div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-purple-800 mb-2">Playout Stage</h2>
                <p className="text-gray-600">
                    In the playout stage, the algorithm performs a simulation from the selected node
                    to a terminal state using a random or heuristic policy. The simulation runs for {data.depth || 'several'} steps
                    before reaching a terminal state and returning scores.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Start Node</h3>
                    
                    {data.startNode ? (
                        <div className="bg-purple-100 border border-purple-200 rounded-lg p-4">
                            <div className="font-medium text-purple-900">Playout Start Node</div>
                            <div className="mt-2 space-y-2">
                                <div className="text-sm">
                                    <span className="font-medium">State:</span> 
                                    <div className="text-gray-600 mt-1 break-words">
                                        {data.startNode.state || 'N/A'}
                                    </div>
                                </div>
                                
                                {data.startNode.statistics && (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="font-medium">Visits:</span> 
                                            <span className="ml-1 text-gray-600">
                                                {data.startNode.statistics.numVisits}
                                            </span>
                                        </div>
                                        
                                        <div>
                                            <span className="font-medium">Is Playout:</span> 
                                            <span className="ml-1 text-gray-600">
                                                {data.startNode.isPlayout ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                
                                {data.startNode.precedingJointMove && (
                                    <div className="text-sm">
                                        <span className="font-medium">Action:</span> 
                                        <div className="text-gray-600 mt-1 font-mono text-xs break-words">
                                            {typeof data.startNode.precedingJointMove === 'string' 
                                                ? data.startNode.precedingJointMove
                                                : JSON.stringify(data.startNode.precedingJointMove, null, 2)
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">No start node data</div>
                    )}
                </Card>
                
                <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Playout Results</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                            <span className="font-medium">Playout Depth:</span>
                            <span className="text-lg font-bold text-purple-700">{data.depth || 'N/A'}</span>
                        </div>
                        
                        {data.results && Object.keys(data.results).length > 0 ? (
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
                                                                    className="bg-purple-600 h-2.5 rounded-full" 
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
                        ) : (
                            <div className="p-4 text-center text-gray-500">No results data</div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default PlayoutStage;