// src/App.js (обновленный)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SessionInputPage from './pages/SessionInputPage';
import TurnSelectionPage from './pages/TurnSelectionPage';
import TreeGrowthPage from './pages/TreeGrowthPage';
import UploadPage from './pages/UploadPage';
import TreePage from './pages/TreePage';
import GridPage from './pages/GridPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* Основные страницы приложения */}
        <Route path="/" element={<SessionInputPage />} />
        <Route path="/turns/:sessionId" element={<TurnSelectionPage />} />
        <Route path="/tree-growth/:sessionId/:turnNumber" element={<TreeGrowthPage />} />
        
        {/* Существующие страницы для загрузки и визуализации произвольных деревьев */}
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/tree" element={<TreePage />} />
        <Route path="/grid" element={<GridPage />} />
        <Route path="/grid/:nodeId" element={<GridPage />} />
        <Route path="/grid-path/:nodePath" element={<GridPage pathMode={true} />} />
        
        {/* Старые маршруты, перенаправляем на новые */}
        <Route path="/tree-growth/:sessionId" element={<Navigate to="/" replace />} />
        
        {/* Обработка несуществующих маршрутов */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;