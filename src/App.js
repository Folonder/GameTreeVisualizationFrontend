// src/App.js (updated)
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import UploadPage from './pages/UploadPage';
import TreePage from './pages/TreePage';
import GridPage from './pages/GridPage';
import SessionInputPage from './pages/SessionInputPage';
import TreeGrowthPage from './pages/TreeGrowthPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<SessionInputPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/tree" element={<TreePage />} />
        <Route path="/grid" element={<GridPage />} />
        <Route path="/grid/:nodeId" element={<GridPage />} />
        <Route path="/grid-path/:nodePath" element={<GridPage pathMode={true} />} />
        <Route path="/tree-growth/:sessionId" element={<TreeGrowthPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;