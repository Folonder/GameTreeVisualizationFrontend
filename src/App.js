// Update src/App.js - Add new route
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SessionInputPage from './pages/SessionInputPage';
import TurnSelectionPage from './pages/TurnSelectionPage';
import TreeGrowthPage from './pages/TreeGrowthPage';
import UploadPage from './pages/UploadPage';
import TreePage from './pages/TreePage';
import GridPage from './pages/GridPage';
import HomePage from './pages/HomePage';
import IterationDetailsPage from './pages/IterationDetailsPage'; // Import the new page

function App() {
  return (
    <Router>
      <Routes>
        {/* Existing routes */}
        <Route path="/" element={<HomePage />} />
        <Route path="/sessions" element={<SessionInputPage />} />
        <Route path="/turns/:sessionId" element={<TurnSelectionPage />} />
        <Route path="/tree-growth/:sessionId/:turnNumber" element={<TreeGrowthPage />} />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/tree" element={<TreePage />} />
        <Route path="/grid" element={<GridPage />} />
        <Route path="/grid/:nodeId" element={<GridPage />} />
        <Route path="/grid-path/:nodePath" element={<GridPage pathMode={true} />} />
        
        {/* New route for iteration details */}
        <Route path="/iteration-details/:sessionId/:turnNumber/:iterationNumber" element={<IterationDetailsPage />} />
        
        {/* Fallback routes */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;