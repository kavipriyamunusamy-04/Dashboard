import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import './App.css';

// Lazy load components
const ProjectDataView = lazy(() => import('./pages/ProjectDataView'));
const DesignerDetails = lazy(() => import('./pages/DesignerDetails_NEW'));

function App() {
  return (
    <Router>
      <Suspense fallback={
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '100vh',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ 
            width: '50px', 
            height: '50px', 
            border: '5px solid #f3f3f3',
            borderTop: '5px solid #00699E',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <p style={{ color: '#00699E', fontSize: '18px' }}>Loading...</p>
        </div>
      }>
        <Routes>
          {/* Main Dashboard - No Authentication Required */}
          <Route path="/" element={<ProjectDataView />} />
          <Route path="/dashboard" element={<ProjectDataView />} />
          
          {/* Designer Details - No Authentication Required */}
          <Route path="/designer/:designerName" element={<DesignerDetails />} />
          
          {/* Catch all - Redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;