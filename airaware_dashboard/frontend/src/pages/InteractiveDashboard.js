import React, { useState, useEffect } from 'react';
import axios from 'axios';
import CurrentAQIDonut from '../components/CurrentAQIDonut';
import ForecastChart from '../components/ForecastChart';
import PollutantTrendsChart from '../components/PollutantTrendsChart';
import AlertPanel from '../components/AlertPanel';
import AdminControls from '../components/AdminControls';
import './InteractiveDashboard.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

function InteractiveDashboard() {
  // Control States
  const [selectedLocation, setSelectedLocation] = useState('Ahmedabad');
  const [timeRange, setTimeRange] = useState('24h');
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
  const [forecastHorizon, setForecastHorizon] = useState('7d');
  const [adminMode, setAdminMode] = useState(false);

  // Data States
  const [locations, setLocations] = useState([]);
  const [forecastData, setForecastData] = useState(null);
  const [trendData, setTrendData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Available pollutants
  const pollutants = ['PM2.5', 'PM10', 'NO2', 'NO', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene', 'Xylene'];

  // Indian states for monitoring stations
  const states = [
    'Ahmedabad', 'Aizawl', 'Amaravati', 'Amritsar', 'Bengaluru', 
    'Bhopal', 'Brajrajnagar', 'Chandigarh', 'Chennai', 'Coimbatore',
    'Delhi', 'Ernakulam', 'Gurugram', 'Guwahati', 'Hyderabad',
    'Jaipur', 'Jorapokhar', 'Kochi', 'Kolkata', 'Lucknow',
    'Mumbai', 'Patna', 'Shillong', 'Talcher', 'Thiruvananthapuram',
    'Visakhapatnam'
  ];

  // Fetch locations on mount
  useEffect(() => {
    fetchLocations();
  }, []);

  // Fetch data when filters change
  useEffect(() => {
    if (selectedLocation) {
      updateDashboard();
    }
  }, [selectedLocation, timeRange, selectedPollutant, forecastHorizon]);

  const fetchLocations = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/locations`);
      setLocations(response.data.cities || states);
    } catch (error) {
      console.error('Error fetching locations:', error);
      // Fallback to states list
      setLocations(states);
    }
  };

  const updateDashboard = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchForecastData(),
        fetchTrendData()
      ]);
      generateAlerts();
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error updating dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchForecastData = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/forecast/7-day`, {
        params: { city: selectedLocation }
      });
      setForecastData(response.data);
    } catch (error) {
      console.error('Error fetching forecast data:', error);
      setForecastData(null);
    }
  };

  const fetchTrendData = async () => {
    try {
      // Calculate hours based on time range
      const hoursMap = {
        '24h': 24,
        '7d': 168,
        '30d': 720
      };
      const hours = hoursMap[timeRange] || 24;

      const response = await axios.get(`${API_BASE_URL}/api/air-quality/pollutant-trends/${selectedLocation}`, {
        params: {
          pollutant: selectedPollutant,
          hours: hours
        }
      });
      setTrendData(response.data.data || []);
    } catch (error) {
      console.error('Error fetching trend data:', error);
      setTrendData([]);
    }
  };

  const generateAlerts = async () => {
    const newAlerts = [];

    try {
      // Get current AQI for the selected location
      const aqiResponse = await axios.get(`${API_BASE_URL}/api/air-quality/current`, {
        params: { location: selectedLocation }
      });

      if (aqiResponse.data.success) {
        const currentAQI = aqiResponse.data.aqi;
        const category = aqiResponse.data.category;

        // Alert based on current AQI levels
        if (currentAQI > 400) {
          newAlerts.push({
            type: 'error',
            icon: '🚨',
            message: `Severe air quality in ${selectedLocation} - AQI ${currentAQI}`,
            severity: 'high'
          });
        } else if (currentAQI > 300) {
          newAlerts.push({
            type: 'error',
            icon: '🔴',
            message: `Very Poor air quality - AQI ${currentAQI}`,
            severity: 'high'
          });
        } else if (currentAQI > 200) {
          newAlerts.push({
            type: 'warning',
            icon: '⚠️',
            message: `Poor air quality - AQI ${currentAQI}. Avoid outdoor activities`,
            severity: 'medium'
          });
        } else if (currentAQI > 100) {
          newAlerts.push({
            type: 'warning',
            icon: '⚠️',
            message: `Moderate air quality - AQI ${currentAQI}`,
            severity: 'medium'
          });
        } else if (currentAQI > 50) {
          newAlerts.push({
            type: 'info',
            icon: 'ℹ️',
            message: `Satisfactory air quality - AQI ${currentAQI}`,
            severity: 'low'
          });
        } else {
          newAlerts.push({
            type: 'success',
            icon: '✅',
            message: `Good air quality - AQI ${currentAQI}`,
            severity: 'low'
          });
        }
      }

      // Alert for high pollutant levels - expanded for all pollutants
      const pollutantLimits = {
        'PM2.5': { limit: 60, safeLimit: 30, unit: 'µg/m³', name: 'PM2.5' },
        'PM10': { limit: 100, safeLimit: 50, unit: 'µg/m³', name: 'PM10' },
        'NO': { limit: 40, safeLimit: 20, unit: 'µg/m³', name: 'Nitric Oxide' },
        'NO2': { limit: 80, safeLimit: 40, unit: 'µg/m³', name: 'Nitrogen Dioxide' },
        'NOx': { limit: 80, safeLimit: 40, unit: 'µg/m³', name: 'Nitrogen Oxides' },
        'NH3': { limit: 400, safeLimit: 200, unit: 'µg/m³', name: 'Ammonia' },
        'CO': { limit: 2, safeLimit: 1, unit: 'mg/m³', name: 'Carbon Monoxide' },
        'SO2': { limit: 80, safeLimit: 40, unit: 'µg/m³', name: 'Sulfur Dioxide' },
        'O3': { limit: 100, safeLimit: 50, unit: 'µg/m³', name: 'Ozone' },
        'Benzene': { limit: 5, safeLimit: 2, unit: 'µg/m³', name: 'Benzene' },
        'Toluene': { limit: 1000, safeLimit: 500, unit: 'µg/m³', name: 'Toluene' }
      };

      // Check current pollutant from historical-forecast data
      try {
        const forecastResponse = await axios.get(`${API_BASE_URL}/api/air-quality/historical-forecast`, {
          params: { 
            city: selectedLocation, 
            pollutant: selectedPollutant,
            hours: 24,
            forecastDays: 7
          }
        });

        if (forecastResponse.data.success) {
          const historical = forecastResponse.data.historical || [];
          const forecast = forecastResponse.data.forecast || [];
          
          // Check latest historical value
          if (historical.length > 0 && pollutantLimits[selectedPollutant]) {
            const latestValue = historical[historical.length - 1].value;
            const pollutantInfo = pollutantLimits[selectedPollutant];
            
            if (latestValue > pollutantInfo.limit) {
              newAlerts.push({
                type: 'error',
                icon: '🔴',
                message: `${pollutantInfo.name} at ${latestValue.toFixed(1)} ${pollutantInfo.unit} - Exceeds safe limit`,
                severity: 'high'
              });
            } else if (latestValue > pollutantInfo.safeLimit) {
              newAlerts.push({
                type: 'warning',
                icon: '⚠️',
                message: `${pollutantInfo.name} at ${latestValue.toFixed(1)} ${pollutantInfo.unit} - Above recommended level`,
                severity: 'medium'
              });
            }
          }

          // Check forecast trend
          if (forecast.length > 0 && pollutantLimits[selectedPollutant]) {
            const avgForecast = forecast.reduce((sum, d) => sum + (d.value || 0), 0) / forecast.length;
            const maxForecast = Math.max(...forecast.map(d => d.value || 0));
            const pollutantInfo = pollutantLimits[selectedPollutant];
            
            if (maxForecast > pollutantInfo.limit) {
              newAlerts.push({
                type: 'warning',
                icon: '📈',
                message: `${pollutantInfo.name} forecast to reach ${maxForecast.toFixed(1)} ${pollutantInfo.unit} in next 7 days`,
                severity: 'medium'
              });
            } else if (avgForecast < pollutantInfo.safeLimit) {
              newAlerts.push({
                type: 'success',
                icon: '✅',
                message: `${pollutantInfo.name} levels forecasted to remain safe`,
                severity: 'low'
              });
            }
          }
        }
      } catch (error) {
        console.error('Error fetching pollutant data for alerts:', error);
      }

    } catch (error) {
      console.error('Error generating alerts:', error);
    }

    // Default alert if no alerts generated
    if (newAlerts.length === 0) {
      newAlerts.push({
        type: 'info',
        icon: 'ℹ️',
        message: `Monitoring ${selectedLocation} - All levels normal`,
        severity: 'info'
      });
    }

    // Get unique alerts and limit to 3
    const uniqueAlerts = newAlerts.filter((alert, index, self) =>
      index === self.findIndex((a) => a.message === alert.message)
    ).slice(0, 3);

    setAlerts(uniqueAlerts);
  };

  const handleUpdateDashboard = () => {
    updateDashboard();
  };

  return (
    <div className="interactive-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1 style={{ color: '#5B21B6', margin: 10 }}>Interactive Dashboard</h1>
      </div>

      <div className="dashboard-layout">
        {/* Sidebar Controls */}
        <aside className="controls-sidebar">
          <div className="controls-card">
            <div className="controls-header">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '20px', height: '20px'}}>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
              Controls
            </div>

            {/* Monitoring Station */}
            <div className="control-group">
              <label>STATE</label>
              <select 
                value={selectedLocation}
                onChange={(e) => setSelectedLocation(e.target.value)}
                className="control-select"
              >
                {locations.map(loc => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
            </div>

            {/* Time Range */}
            <div className="control-group">
              <label>Time Range</label>
              <select 
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                className="control-select"
              >
                <option value="24h">Last 24 Hours</option>
                <option value="7d">Last 7 Days</option>
                <option value="30d">Last 30 Days</option>
              </select>
            </div>

            {/* Pollutant */}
            <div className="control-group">
              <label>Pollutant</label>
              <select 
                value={selectedPollutant}
                onChange={(e) => setSelectedPollutant(e.target.value)}
                className="control-select"
              >
                {pollutants.map(poll => (
                  <option key={poll} value={poll}>{poll}</option>
                ))}
              </select>
            </div>

            {/* Forecast Horizon */}
            <div className="control-group">
              <label>Forecast Horizon</label>
              <select 
                value={forecastHorizon}
                onChange={(e) => setForecastHorizon(e.target.value)}
                className="control-select"
              >
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
                <option value="14d">14 Days</option>
              </select>
            </div>

            {/* Update Button */}
            <button 
              className="update-button"
              onClick={handleUpdateDashboard}
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Updating...
                </>
              ) : (
                <>
                  🔄 Update Dashboard
                </>
              )}
            </button>

            {/* Admin Mode Toggle */}
            <div className="admin-toggle">
              <label className="toggle-label">
                <input 
                  type="checkbox"
                  checked={adminMode}
                  onChange={(e) => setAdminMode(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-text">🔐 Admin Mode</span>
              </label>
            </div>

            {/* Last Updated */}
            <div className="last-updated">
              <small>Last Updated: {lastUpdated.toLocaleTimeString()}</small>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="dashboard-main">
          {/* Top Row */}
          <div className="dashboard-grid">
            {/* Current Air Quality */}
            <div className="dashboard-card">
              <div className="card-title">Current Air Quality</div>
              <CurrentAQIDonut location={selectedLocation} />
            </div>

            {/* PM2.5 Forecast */}
            <div className="dashboard-card">
              <div className="card-title">{selectedPollutant} Forecast</div>
              <ForecastChart 
                location={selectedLocation}
                pollutant={selectedPollutant}
                timeRange={timeRange}
                forecastHorizon={forecastHorizon}
                loading={loading}
              />
            </div>
          </div>

          {/* Bottom Row */}
          <div className="dashboard-grid">
            {/* Pollutant Trends */}
            <div className="dashboard-card">
              <div className="card-title">Pollutant Trends</div>
              <PollutantTrendsChart 
                location={selectedLocation}
              />
            </div>

            {/* Alert Notifications */}
            <div className="dashboard-card">
              <div className="card-title">Alert Notifications</div>
              <AlertPanel alerts={alerts} />
            </div>
          </div>

          {/* Admin Panel (Conditional) */}
          {adminMode && (
            <div className="admin-section">
              <AdminControls />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default InteractiveDashboard;
