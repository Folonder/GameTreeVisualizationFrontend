const API_URL = process.env.REACT_APP_API_URL;

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
        console.log('Successful response:', data);
        return data;
    }
    
    throw new Error('Unexpected response type');
}

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