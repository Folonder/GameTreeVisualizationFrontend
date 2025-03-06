// src/hooks/useAppState.js
import { useState, useCallback, useEffect } from 'react';

/**
 * Хук для глобального состояния приложения
 */
export const useAppState = () => {
    // Состояние локального хранилища
    const [hasStoredData, setHasStoredData] = useState(false);
    
    // Проверяем наличие данных в localStorage
    useEffect(() => {
        const checkStorage = () => {
            const hasData = localStorage.getItem('treeData') !== null;
            setHasStoredData(hasData);
        };
        
        // Проверяем при инициализации
        checkStorage();
        
        // Слушаем изменения в localStorage
        const handleStorageChange = () => checkStorage();
        window.addEventListener('storage', handleStorageChange);
        
        return () => window.removeEventListener('storage', handleStorageChange);
    }, []);
    
    // Загрузка данных из localStorage
    const loadTreeData = useCallback(() => {
        try {
            const data = localStorage.getItem('treeData');
            return data ? JSON.parse(data) : null;
        } catch (err) {
            console.error('Error loading tree data:', err);
            return null;
        }
    }, []);
    
    // Сохранение данных в localStorage
    const saveTreeData = useCallback((data) => {
        try {
            localStorage.setItem('treeData', JSON.stringify(data));
            setHasStoredData(true);
        } catch (err) {
            console.error('Error saving tree data:', err);
        }
    }, []);
    
    // Удаление данных из localStorage
    const clearTreeData = useCallback(() => {
        localStorage.removeItem('treeData');
        setHasStoredData(false);
    }, []);
    
    return {
        hasStoredData,
        loadTreeData,
        saveTreeData,
        clearTreeData
    };
};

/**
 * Хук для сохранения состояния между сессиями
 */
export const usePersistentState = (key, initialValue) => {
    // Читаем сохраненное значение из localStorage
    const getStoredValue = () => {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Error reading ${key} from localStorage:`, error);
            return initialValue;
        }
    };

    // Устанавливаем состояние из localStorage или используем initialValue
    const [value, setValue] = useState(getStoredValue);

    // Обновляем localStorage при изменении состояния
    useEffect(() => {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error(`Error writing ${key} to localStorage:`, error);
        }
    }, [key, value]);

    return [value, setValue];
};