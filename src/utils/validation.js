// src/utils/validation.js
export const validateTreeData = (data) => {
    const errors = [];

    if (!data) {
        return {
            isValid: false,
            errors: ['No data provided']
        };
    }

    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;

        // Проверка обязательных полей
        if (!parsed.state) {
            errors.push('Missing required field: state');
        }

        if (!parsed.statistics) {
            errors.push('Missing required field: statistics');
        } else {
            // Проверка структуры статистики
            if (typeof parsed.statistics.numVisits !== 'number') {
                errors.push('Invalid statistics: numVisits must be a number');
            }

            if (!Array.isArray(parsed.statistics.statisticsForActions)) {
                errors.push('Invalid statistics: statisticsForActions must be an array');
            } else {
                // Проверка структуры действий
                parsed.statistics.statisticsForActions.forEach((roleStat, index) => {
                    if (!roleStat.role) {
                        errors.push(`Invalid statistics: missing role in statisticsForActions[${index}]`);
                    }
                    if (!Array.isArray(roleStat.actions)) {
                        errors.push(`Invalid statistics: actions must be an array in statisticsForActions[${index}]`);
                    } else {
                        roleStat.actions.forEach((action, actionIndex) => {
                            if (!action.action) {
                                errors.push(`Invalid statistics: missing action name in statisticsForActions[${index}].actions[${actionIndex}]`);
                            }
                            if (typeof action.averageActionScore !== 'number') {
                                errors.push(`Invalid statistics: averageActionScore must be a number in statisticsForActions[${index}].actions[${actionIndex}]`);
                            }
                            if (typeof action.actionNumUsed !== 'number') {
                                errors.push(`Invalid statistics: actionNumUsed must be a number in statisticsForActions[${index}].actions[${actionIndex}]`);
                            }
                        });
                    }
                });
            }
        }

        return {
            isValid: errors.length === 0,
            errors,
            data: parsed
        };
    } catch (err) {
        return {
            isValid: false,
            errors: ['Invalid JSON format: ' + err.message]
        };
    }
};

export const validateNodeLimit = (limit, totalNodes) => {
    if (typeof limit !== 'number') {
        return {
            isValid: false,
            error: 'Node limit must be a number'
        };
    }

    if (limit < 10) {
        return {
            isValid: false,
            error: 'Node limit must be at least 10'
        };
    }

    if (limit > totalNodes) {
        return {
            isValid: false,
            error: `Node limit cannot exceed total number of nodes (${totalNodes})`
        };
    }

    return { isValid: true };
};

export const validateDepthFilter = (depth, value) => {
    if (typeof value !== 'number') {
        return {
            isValid: false,
            error: 'Filter value must be a number'
        };
    }

    if (value < 0 || value > 100) {
        return {
            isValid: false,
            error: 'Filter value must be between 0 and 100'
        };
    }

    return { isValid: true };
};