export const validateTreeData = (data) => {
    if (!data) {
        return { isValid: false, error: 'No data provided' };
    }

    try {
        const parsed = typeof data === 'string' ? JSON.parse(data) : data;
        
        // Проверяем базовую структуру
        if (!parsed.state || !parsed.statistics) {
            return { 
                isValid: false, 
                error: 'Invalid tree structure: missing required fields' 
            };
        }

        return { isValid: true, data: parsed };
    } catch (err) {
        return { 
            isValid: false, 
            error: 'Invalid JSON format' 
        };
    }
};