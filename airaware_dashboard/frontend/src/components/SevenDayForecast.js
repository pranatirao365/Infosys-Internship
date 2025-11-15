import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SevenDayForecast.css';

function SevenDayForecast({ location }) {
  const [forecastData, setForecastData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // AQI Category colors and thresholds - Professional palette
  const getAQICategory = (aqi) => {
    if (aqi <= 50) return { category: 'Good', color: '#10b981', bgColor: '#d1fae5' };
    if (aqi <= 100) return { category: 'Satisfactory', color: '#f59e0b', bgColor: '#fef3c7' };
    if (aqi <= 200) return { category: 'Moderate', color: '#f97316', bgColor: '#fed7aa' };
    if (aqi <= 300) return { category: 'Poor', color: '#ef4444', bgColor: '#fecaca' };
    if (aqi <= 400) return { category: 'Very Poor', color: '#8b5cf6', bgColor: '#ede9fe' };
    return { category: 'Severe', color: '#78350f', bgColor: '#d4a574' };
  };

  useEffect(() => {
    const fetchForecast = async () => {
      if (!location) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`🔮 Fetching 7-day forecast for ${location}...`);
        
        const response = await axios.get('http://localhost:8000/api/forecast/7-day', {
          params: { city: location },
          timeout: 5000
        });

        if (response.data.success) {
          console.log(`✅ Forecast received:`, response.data.forecast);
          
          // Format data with category info
          const formattedData = response.data.forecast.map(day => ({
            ...day,
            ...getAQICategory(day.aqi)
          }));
          
          setForecastData(formattedData);
        }
      } catch (err) {
        console.error('❌ Error fetching forecast:', err);
        setError(err.response?.data?.error || 'Failed to fetch forecast data');
      } finally {
        setLoading(false);
      }
    };

    fetchForecast();
  }, [location]);

  return (
    <div className="seven-day-forecast">
      <div className="forecast-header">
        <h4>7-Day Forecast</h4>
      </div>

      {loading && (
        <div className="forecast-loading">
          <div className="spinner"></div>
          <p>Loading forecast...</p>
        </div>
      )}

      {error && (
        <div className="forecast-error">
          <span className="error-icon">⚠️</span>
          <p>{error}</p>
        </div>
      )}

      {!loading && !error && forecastData.length > 0 && (
        <>
          <div className="forecast-cards">
            {forecastData.map((day, index) => (
              <div 
                key={index} 
                className="forecast-card"
                style={{ backgroundColor: day.bgColor }}
              >
                <div className="card-day" style={{ color: day.color }}>
                  {day.day}
                </div>
                <div className="card-aqi">
                  <span className="aqi-label">AQI</span>
                  <span className="aqi-value" style={{ color: day.color }}>
                    {Math.round(day.aqi)}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Legend */}
          <div className="forecast-legend">
            <div className="legend-item">
              <div className="legend-indicator">
                <span className="legend-line" style={{ background: '#10b981' }}></span>
                <span className="legend-dot" style={{ background: '#10b981' }}></span>
              </div>
              <div className="legend-text">
                <span className="range">0-50</span>
                <span className="category">Good</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-indicator">
                <span className="legend-line" style={{ background: '#f59e0b' }}></span>
                <span className="legend-dot" style={{ background: '#f59e0b' }}></span>
              </div>
              <div className="legend-text">
                <span className="range">50-100</span>
                <span className="category">Satisfactory</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-indicator">
                <span className="legend-line" style={{ background: '#f97316' }}></span>
                <span className="legend-dot" style={{ background: '#f97316' }}></span>
              </div>
              <div className="legend-text">
                <span className="range">100-200</span>
                <span className="category">Moderate</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-indicator">
                <span className="legend-line" style={{ background: '#ef4444' }}></span>
                <span className="legend-dot" style={{ background: '#ef4444' }}></span>
              </div>
              <div className="legend-text">
                <span className="range">200-300</span>
                <span className="category">Poor</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-indicator">
                <span className="legend-line" style={{ background: '#8b5cf6' }}></span>
                <span className="legend-dot" style={{ background: '#8b5cf6' }}></span>
              </div>
              <div className="legend-text">
                <span className="range">300-400</span>
                <span className="category">Very Poor</span>
              </div>
            </div>
            <div className="legend-item">
              <div className="legend-indicator">
                <span className="legend-line" style={{ background: '#78350f' }}></span>
                <span className="legend-dot" style={{ background: '#78350f' }}></span>
              </div>
              <div className="legend-text">
                <span className="range">&gt;400</span>
                <span className="category">Severe</span>
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !error && forecastData.length === 0 && (
        <div className="forecast-empty">
          <span className="empty-icon">📭</span>
          <p>No forecast data available</p>
          <small>Predictions will be generated soon</small>
        </div>
      )}
    </div>
  );
}

export default SevenDayForecast;
