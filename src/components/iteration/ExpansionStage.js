// src/components/iteration/ExpansionStage.js
import React from 'react';
import Card from '../common/Card';

const ExpansionStage = ({ data }) => {
    if (!data) {
        return <div className="text-center py-8 text-gray-500">No expansion data available</div>;
    }
    
    return (
        <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg">
                <h2 className="text-lg font-medium text-green-800 mb-2">Expansion Stage</h2>
                <p className="text-gray-600">
                    In the expansion stage, one or more new child nodes are added to the selected node
                    based on available actions. Then, one of these new nodes is selected for the playout stage.
                </p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Expanded Node</h3>
                    
                    {data.expandedNode ? (
                        <div className="bg-green-100 border border-green-200 rounded-lg p-4">
                            <div className="font-medium text-green-900">Node To Expand</div>
                            <div className="mt-2 space-y-2">
                                <div className="text-sm">
                                    <span className="font-medium">State:</span> 
                                    <div className="text-gray-600 mt-1 break-words">
                                        {data.expandedNode.state || 'N/A'}
                                    </div>
                                </div>
                                
                                {data.expandedNode.statistics && (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <span className="font-medium">Visits:</span> 
                                            <span className="ml-1 text-gray-600">
                                                {data.expandedNode.statistics.numVisits}
                                            </span>
                                        </div>
                                        
                                        <div>
                                            <span className="font-medium">Is Playout:</span> 
                                            <span className="ml-1 text-gray-600">
                                                {data.expandedNode.isPlayout ? 'Yes' : 'No'}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="p-4 text-center text-gray-500">No expanded node data</div>
                    )}
                </Card>
                
                <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">New Nodes ({data.newNodes?.length || 0})</h3>
                    
                    <div className="border rounded-lg overflow-auto max-h-96">
                        {data.newNodes && data.newNodes.length > 0 ? (
                            <div className="divide-y">
                                {data.newNodes.map((node, index) => {
                                    const isPlayoutNode = node === data.nodeForPlayout;
                                    return (
                                        <div 
                                            key={index} 
                                            className={`p-3 ${
                                                isPlayoutNode 
                                                    ? 'bg-yellow-50 border-l-4 border-yellow-400' 
                                                    : index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                                            }`}
                                        >
                                            <div className="flex justify-between items-center">
                                                <span className="font-medium">Child Node {index + 1}</span>
                                                {isPlayoutNode && (
                                                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                                                        Selected for Playout
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="text-sm text-gray-600 mt-1 truncate">
                                                State: {node.state ? node.state.substring(0, 40) + '...' : 'N/A'}
                                            </div>
                                            
                                            {node.precedingJointMove && (
                                                <div className="text-xs text-gray-500 mt-1">
                                                    Action: {
                                                        typeof node.precedingJointMove === 'string' 
                                                            ? node.precedingJointMove
                                                            : JSON.stringify(node.precedingJointMove).substring(0, 40) + '...'
                                                    }
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-4 text-center text-gray-500">No new nodes created</div>
                        )}
                    </div>
                </Card>
            </div>
            
            {data.nodeForPlayout && (
                <Card className="p-4">
                    <h3 className="text-md font-medium mb-3">Node Selected for Playout</h3>
                    
                    <div className="bg-yellow-100 border border-yellow-200 rounded-lg p-4">
                        <div className="font-medium text-yellow-900">Playout Node</div>
                        <div className="mt-2 space-y-2">
                            <div className="text-sm">
                                <span className="font-medium">State:</span> 
                                <div className="text-gray-600 mt-1 break-words">
                                    {data.nodeForPlayout.state || 'N/A'}
                                </div>
                            </div>
                            
                            {data.nodeForPlayout.precedingJointMove && (
                                <div className="text-sm">
                                    <span className="font-medium">Action:</span> 
                                    <div className="text-gray-600 mt-1 font-mono text-xs break-words">
                                        {typeof data.nodeForPlayout.precedingJointMove === 'string' 
                                            ? data.nodeForPlayout.precedingJointMove
                                            : JSON.stringify(data.nodeForPlayout.precedingJointMove, null, 2)
                                        }
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
};

export default ExpansionStage;