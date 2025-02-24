// components/tree/Tooltip.js
const Tooltip = ({ x, y, node }) => {
    if (!node) return null;

    const stats = node.statistics;
    if (!stats) return null;

    return (
        <div 
            className="absolute z-50 bg-white p-3 rounded shadow-lg border text-sm max-w-xs"
            style={{
                left: x + 10,
                top: y - 10,
                transform: 'translateY(-100%)'
            }}
        >
            <div className="font-medium mb-2 text-gray-700">Node Statistics</div>
            <div className="space-y-1">
                <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Visits:</span>
                    <span className="font-medium">{stats.numVisits}</span>
                </div>
                <div className="flex justify-between gap-4">
                    <span className="text-gray-600">Relative:</span>
                    <span className="font-medium">{Math.round(stats.relativeVisits)}%</span>
                </div>
                {stats.statisticsForActions?.length > 0 && (
                    <div className="mt-2">
                        <div className="text-gray-600 mb-1">Actions:</div>
                        {stats.statisticsForActions.map((roleStat, index) => (
                            <div key={index} className="pl-2">
                                <div className="font-medium text-gray-700">{roleStat.role}:</div>
                                {roleStat.actions.map((action, actionIndex) => (
                                    <div key={actionIndex} className="pl-2 text-xs">
                                        <div className="flex justify-between">
                                            <span>{action.action}:</span>
                                            <span className="font-medium ml-2">
                                                {Math.round(action.averageActionScore * 100) / 100}
                                                ({action.actionNumUsed})
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Tooltip;