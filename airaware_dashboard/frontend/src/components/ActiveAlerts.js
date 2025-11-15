import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ActiveAlerts.css';

function ActiveAlerts({ location }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const generateAlerts = async () => {
      if (!location) return;

      setLoading(true);

      try {
        // Fetch forecast data
        const response = await axios.get('http://localhost:8000/api/forecast/7-day', {
          params: { city: location },
          timeout: 5000
        });

        if (response.data.success) {
          const forecast = response.data.forecast;
          const generatedAlerts = [];

          // Check each day's forecast for alerts
          forecast.forEach((day, index) => {
            const aqi = day.aqi;
            
            // Unhealthy for Sensitive Groups (101-200)
            if (aqi > 100 && aqi <= 200) {
              generatedAlerts.push({
                id: `alert-${index}-sensitive`,
                type: 'warning',
                icon: '⚠️',
                title: 'Unhealthy for Sensitive Groups',
                description: `AQI ${Math.round(aqi)} expected on ${day.day}`,
                severity: 'moderate',
                color: '#fb923c'
              });
            }
            
            // Unhealthy (201-300)
            if (aqi > 200 && aqi <= 300) {
              generatedAlerts.push({
                id: `alert-${index}-unhealthy`,
                type: 'danger',
                icon: '🔴',
                title: 'Unhealthy Air Quality',
                description: `AQI ${Math.round(aqi)} predicted for ${day.day}`,
                severity: 'high',
                color: '#ef4444'
              });
            }
            
            // Very Unhealthy (301-400)
            if (aqi > 300 && aqi <= 400) {
              generatedAlerts.push({
                id: `alert-${index}-very-unhealthy`,
                type: 'danger',
                icon: '⛔',
                title: 'Very Unhealthy Air Quality',
                description: `AQI ${Math.round(aqi)} - Severe pollution on ${day.day}`,
                severity: 'critical',
                color: '#dc2626'
              });
            }
            
            // Hazardous (400+)
            if (aqi > 400) {
              generatedAlerts.push({
                id: `alert-${index}-hazardous`,
                type: 'danger',
                icon: '☠️',
                title: 'Hazardous Air Quality',
                description: `AQI ${Math.round(aqi)} - Emergency conditions on ${day.day}`,
                severity: 'critical',
                color: '#991b1b'
              });
            }

            // Check for sudden AQI spike
            if (index > 0 && (aqi - forecast[index - 1].aqi) > 50) {
              generatedAlerts.push({
                id: `alert-${index}-spike`,
                type: 'warning',
                icon: '📈',
                title: 'Sharp AQI Increase Expected',
                description: `AQI rising from ${Math.round(forecast[index - 1].aqi)} to ${Math.round(aqi)} on ${day.day}`,
                severity: 'moderate',
                color: '#f59e0b'
              });
            }
          });

          // Limit to top 3 most severe alerts
          const sortedAlerts = generatedAlerts
            .sort((a, b) => {
              const severityOrder = { critical: 3, high: 2, moderate: 1, info: 0 };
              return severityOrder[b.severity] - severityOrder[a.severity];
            })
            .slice(0, 3);

          setAlerts(sortedAlerts);
        }
      } catch (err) {
        console.error('Error generating alerts:', err);
        setAlerts([]);
      } finally {
        setLoading(false);
      }
    };

    generateAlerts();
  }, [location]);

  return (
    <div className="active-alerts">
      <div className="alerts-header">
        <h4>Active Alerts</h4>
      </div>

      {loading && (
        <div className="alerts-loading">
          <div className="spinner-small"></div>
          <p>Checking alerts...</p>
        </div>
      )}

      {!loading && alerts.length === 0 && (
        <div className="no-alerts">
          <span className="check-icon">✅</span>
          <p>No active alerts</p>
          <small>Air quality within acceptable levels</small>
        </div>
      )}

      {!loading && alerts.length > 0 && (
        <div className="alerts-list">
          {alerts.map((alert) => (
            <div 
              key={alert.id} 
              className={`alert-item alert-${alert.severity}`}
              style={{ borderLeftColor: alert.color }}
            >
              <span className="alert-icon">{alert.icon}</span>
              <div className="alert-content">
                <div className="alert-title">{alert.title}</div>
                <div className="alert-description">{alert.description}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default ActiveAlerts;
