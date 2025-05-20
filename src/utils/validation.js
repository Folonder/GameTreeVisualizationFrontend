export const validateTreeData = (data) => {
    // Минимальная проверка - данные должны быть объектом, но структура не проверяется
    if (!data) {
        return {
            isValid: false,
            errors: ['Данные не предоставлены']
        };
    }

    try {
        // Просто проверяем, что данные - это объект или JSON строка
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;

        if (typeof parsed !== 'object' || parsed === null) {
            return {
                isValid: false,
                errors: ['Данные должны быть объектом в формате JSON']
            };
        }

        return {
            isValid: true,
            data: parsed
        };
    } catch (err) {
        return {
            isValid: false,
            errors: ['Неверный формат JSON: ' + err.message]
        };
    }
};

export const validateNodeLimit = (limit, totalNodes) => {
    return { isValid: true };
};

export const validateDepthFilter = (depth, value) => {
    return { isValid: true };
};