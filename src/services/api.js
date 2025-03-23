const API_URL = process.env.REACT_APP_API_URL;

// In your API service file
async function getTreeMetadata(treeId) {
    const url = `${API_URL}/TreePlayback/${treeId}/metadata`;
    console.log('Requesting metadata from:', url);
    
    try {
        const response = await fetch(url);
        console.log('Response status:', response.status);
        
        // Log the raw response text first to see what's coming back
        const text = await response.text();
        console.log('Raw response:', text);
        
        // Try to parse it as JSON (this will fail if it's HTML)
        try {
            const data = JSON.parse(text);
            return data;
        } catch (e) {
            console.error('JSON parse error:', e);
            throw new Error(`Invalid JSON response: ${text.substring(0, 100)}...`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
        throw error;
    }
}

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