// src/App.js
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import TreePage from './pages/TreePage';
import { TREE_CONSTANTS } from './components/tree/constants';

function App() {
  // При инициализации приложения устанавливаем переменные CSS для темизации
  useEffect(() => {
    const root = document.documentElement;
    
    // Цвета
    root.style.setProperty('--color-node-normal', TREE_CONSTANTS.COLORS.STROKE.NORMAL);
    root.style.setProperty('--color-node-expanded', TREE_CONSTANTS.COLORS.STROKE.EXPANDED);
    root.style.setProperty('--color-node-hidden', TREE_CONSTANTS.COLORS.STROKE.HAS_HIDDEN);
    root.style.setProperty('--color-node-limited', TREE_CONSTANTS.COLORS.STROKE.DEPTH_LIMITED);
    root.style.setProperty('--color-node-filtered', TREE_CONSTANTS.COLORS.STROKE.FILTERED);
    root.style.setProperty('--color-link', TREE_CONSTANTS.COLORS.LINK);
    
    // Размеры
    root.style.setProperty('--stroke-width-normal', `${TREE_CONSTANTS.STYLE.STROKE_WIDTH.NORMAL}px`);
    root.style.setProperty('--stroke-width-highlighted', `${TREE_CONSTANTS.STYLE.STROKE_WIDTH.HIGHLIGHTED}px`);
    
    // Анимации
    root.style.setProperty('--animation-duration', `${TREE_CONSTANTS.ANIMATION.DURATION}ms`);
    root.style.setProperty('--animation-easing', TREE_CONSTANTS.ANIMATION.EASING);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/tree" element={<TreePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;