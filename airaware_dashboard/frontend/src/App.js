import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';
import Navigation from './components/Navigation';
import DataExplorer from './pages/DataExplorer';
import ForecastEngine from './pages/ForecastEngine';
import AirQualityMonitor from './pages/AirQualityMonitor';
import InteractiveDashboard from './pages/InteractiveDashboard';

function App() {
  return (
    <Router>
      <div className="App">
        <header className="app-header">
          <h1>🌍 AirAware Dashboard</h1>
          <p>Comprehensive Air Quality Monitoring & Forecasting Platform</p>
        </header>

        <Navigation />

        <Routes>
          <Route path="/" element={<DataExplorer />} />
          <Route path="/forecast" element={<ForecastEngine />} />
          <Route path="/monitor" element={<AirQualityMonitor />} />
          <Route path="/interactive" element={<InteractiveDashboard />} />
        </Routes>

        <footer className="app-footer">
          <p>© 2024 AirAware | Air Quality Monitoring & Forecasting</p>
        </footer>
      </div>
    </Router>
  );
}

export default App;
