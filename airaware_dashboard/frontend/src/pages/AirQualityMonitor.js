import React, { useState, useEffect } from 'react';
import './AirQualityMonitor.css';
import CurrentAQIDonut from '../components/CurrentAQIDonut';
import PollutantConcentrations from '../components/PollutantConcentrations';
import SevenDayForecast from '../components/SevenDayForecast';
import ActiveAlerts from '../components/ActiveAlerts';
import axios from 'axios';

function AirQualityMonitor() {
  const [selectedLocation, setSelectedLocation] = useState('Delhi');
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch available cities from backend on component mount
  useEffect(() => {
    fetchCities();
  }, []);

  const fetchCities = async () => {
    try {
      const response = await axios.get('http://localhost:8000/api/air-quality/cities');
      if (response.data.success && response.data.cities.length > 0) {
        setLocations(response.data.cities);
        // Set first city as default if Delhi is not available
        if (!response.data.cities.includes('Delhi')) {
          setSelectedLocation(response.data.cities[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
      // Fallback to a minimal list if API fails
      setLocations(['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata']);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="air-quality-monitor">
      {/* Header Section */}
      <div className="monitor-header">
        <h1>Air Quality Alert System</h1>
      </div>

      {/* Main Grid - 2x2 Layout */}
      <div className="monitor-grid">
        {/* Top Left: Current Air Quality (Donut Chart) */}
        <div className="monitor-card">
          <div className="card-header-monitor">
            <h3>Current Air Quality</h3>
            <select 
              className="location-selector"
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
            >
              {locations.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>
          <CurrentAQIDonut location={selectedLocation} />
        </div>

        {/* Top Right: 7-Day Forecast */}
        <div className="monitor-card">
          <div className="card-header-monitor">
            <h3>7-Day Forecast</h3>
          </div>
          <SevenDayForecast location={selectedLocation} />
        </div>

        {/* Bottom Left: Pollutant Concentrations */}
        <div className="monitor-card">
          <div className="card-header-monitor">
            <h3>Pollutant Concentrations</h3>
          </div>
          <PollutantConcentrations location={selectedLocation} />
        </div>

        {/* Bottom Right: Active Alerts */}
        <div className="monitor-card">
          <div className="card-header-monitor">
            <h3>Active Alerts</h3>
          </div>
          <ActiveAlerts location={selectedLocation} />
        </div>
      </div>
    </div>
  );
}

export default AirQualityMonitor;
