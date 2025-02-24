import { useState, useCallback } from 'react';
import { treeApi } from '../services/api';

const useTreeData = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const uploadTree = useCallback(async (jsonData) => {
        setLoading(true);
        setError(null);
        try {
            console.log('Uploading tree data:', jsonData); // Лог перед загрузкой
            const result = await treeApi.uploadTree(jsonData);
            console.log('Received tree data:', result); // Лог полученных данных
            setData(result);
        } catch (err) {
            setError(err.message);
            console.error('Error uploading tree:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    const refreshTree = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await treeApi.getCurrentTree();
            if (result) {
                setData(result);
            }
        } catch (err) {
            setError(err.message);
            console.error('Error refreshing tree:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        data,
        loading,
        error,
        uploadTree,
        refreshTree
    };
};

export default useTreeData;