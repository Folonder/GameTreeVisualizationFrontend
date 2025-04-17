// src/services/api.js
const API_URL =  process.env.REACT_APP_API_URL || 'http://localhost/api';

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

export const sessionApi = {
    async checkSession(sessionId) {
        const response = await fetch(`${API_URL}GameSession/exists`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
        });
        return handleResponse(response);
    },

    async getAvailableTurns(sessionId) {
        const response = await fetch(`${API_URL}GameSession/turns`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId }),
        });
        return handleResponse(response);
    },

    async getTurnGrowth(sessionId, turnNumber) {
        const response = await fetch(`${API_URL}GameSession/turn/growth`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ sessionId, turnNumber }),
        });
        return handleResponse(response);
    },
    
    async getAllTurnsGrowth(sessionId) {
        try {
            const turns = await this.getAvailableTurns(sessionId);
            
            if (!turns || turns.length === 0) {
                throw new Error('No turns available');
            }
            
            const allTurnsData = [];
            
            for (const turnNumber of turns) {
                const turnGrowth = await this.getTurnGrowth(sessionId, turnNumber);
                
                if (turnGrowth && turnGrowth.length > 0) {
                    allTurnsData.push({
                        turnNumber,
                        steps: turnGrowth
                    });
                }
            }
            
            return allTurnsData;
        } catch (error) {
            console.error('Error fetching all turns growth:', error);
            throw error;
        }
    }
};