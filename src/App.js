// src/App.js (обновленный)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SessionInputPage from './pages/SessionInputPage';
import UploadPage from './pages/UploadPage';
import TreePage from './pages/TreePage';
import GridPage from './pages/GridPage';
import HomePage from './pages/HomePage';
import TreeGrowthPage from './pages/TreeGrowthPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Основные страницы приложения */}
        <Route path="/" element={<HomePage />} />
        <Route path="/sessions" element={<SessionInputPage />} />
        <Route path="/tree-growth/:sessionId" element={<TreeGrowthPage />} />
        
        {/* Существующие страницы для загрузки и визуализации произвольных деревьев */}
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/tree" element={<TreePage />} />
        <Route path="/grid" element={<GridPage />} />
        <Route path="/grid/:nodeId" element={<GridPage />} />
        <Route path="/grid-path/:nodePath" element={<GridPage pathMode={true} />} />
        
        {/* Старые маршруты, перенаправляем на новые */}
        <Route path="/turns/:sessionId" element={<Navigate to={p => `/tree-growth/${p.params.sessionId}`} replace />} />
        <Route path="/tree-growth/:sessionId/:turnNumber" element={<Navigate to={p => `/tree-growth/${p.params.sessionId}`} replace />} />
        
        {/* Обработка несуществующих маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;