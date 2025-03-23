// src/services/api.js
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5002/api';

// Обработчик ответов от API
async function handleResponse(response) {
    const contentType = response.headers.get('content-type');
    
    if (!response.ok) {
        let errorMessage;
        try {
            if (contentType?.includes('application/json')) {
                const errorData = await response.json();
                console.log('Error response:', errorData);
                errorMessage = errorData.message || JSON.stringify(errorData);
            } else {
                errorMessage = await response.text();
            }
        } catch (err) {
            console.error('Error parsing response:', err);
            errorMessage = response.statusText;
        }
        throw new Error(errorMessage);
    }
    
    if (contentType?.includes('application/json')) {
        const data = await response.json();
        return data;
    }
    
    return await response.text();
}

// API для работы с деревьями
export const treeApi = {
    async uploadTree(jsonData) {
        const response = await fetch(`${API_URL}/GameTree/process`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: jsonData
        });
        return handleResponse(response);
    },

    async getCurrentTree() {
        const response = await fetch(`${API_URL}/GameTree/current`);
        if (response.status === 404) {
            return null;
        }
        return handleResponse(response);
    },

    async getStats() {
        const response = await fetch(`${API_URL}/GameTree/stats`);
        return handleResponse(response);
    }
};

// API для работы с сессиями игр
export const sessionApi = {
    async checkSession(sessionId) {
        const response = await fetch(`${API_URL}/GameSession/exists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
        });
        return handleResponse(response);
    },

    async getAvailableTurns(sessionId) {
        const response = await fetch(`${API_URL}/GameSession/turns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
        });
        return handleResponse(response);
    },

    async getTurnGrowth(sessionId, turnNumber) {
        const response = await fetch(`${API_URL}/GameSession/turn/growth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, turnNumber }),
        });
        return handleResponse(response);
    },

    async getTreeGrowth(sessionId) {
        const response = await fetch(`${API_URL}/GameSession/growth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
        });
        return handleResponse(response);
    },
    
    // Получение начального состояния дерева для хода
    async getInitialTree(sessionId, turnNumber) {
        const response = await fetch(`${API_URL}/GameSession/turn/initial`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, turnNumber }),
        });
        return handleResponse(response);
    }
};