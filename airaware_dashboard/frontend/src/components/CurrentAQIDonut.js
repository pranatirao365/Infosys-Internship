import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function CurrentAQIDonut({ location }) {
  const [aqiData, setAqiData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentAQI();
  }, [location]);

  const fetchCurrentAQI = async () => {
    setLoading(true);
    try {
      // Call backend API to get current AQI for the location
      const response = await axios.get(`http://localhost:8000/api/air-quality/current?location=${location}`);
      
      if (response.data.success) {
        setAqiData({
          aqi: response.data.aqi,
          category: response.data.category,
          location: response.data.location,
          color: response.data.color
        });
      } else {
        throw new Error('Failed to fetch AQI data');
      }
    } catch (error) {
      console.error('Error fetching AQI data:', error);
      // Set error state instead of dummy data
      setAqiData(null);
    } finally {
      setLoading(false);
    }
  };

  // Get AQI category based on value
  const getAQICategory = (aqi) => {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
  };

  // Get color based on AQI category - Professional palette
  const getAQIColor = (aqi) => {
    if (aqi <= 50) return '#10b981'; // Professional Green
    if (aqi <= 100) return '#f59e0b'; // Amber/Gold  
    if (aqi <= 150) return '#f97316'; // Warm Orange
    if (aqi <= 200) return '#ef4444'; // Clear Red
    if (aqi <= 300) return '#8b5cf6'; // Elegant Purple
    return '#78350f'; // Rich Brown
  };

  // Create donut chart data based on Indian AQI scale
  const createDonutData = (aqi) => {
    // Indian AQI Scale segments with proportional sizes
    const segments = [
      { range: [0, 50], label: 'Good', color: '#10b981', value: 50 },
      { range: [50, 100], label: 'Satisfactory', color: '#f59e0b', value: 50 },
      { range: [100, 200], label: 'Moderate', color: '#f97316', value: 100 },
      { range: [200, 300], label: 'Poor', color: '#ef4444', value: 100 },
      { range: [300, 400], label: 'Very Poor', color: '#8b5cf6', value: 100 },
      { range: [400, 500], label: 'Severe', color: '#78350f', value: 100 }
    ];
    
    // Determine which segments should be filled based on current AQI
    return segments.map((segment) => {
      const [min, max] = segment.range;
      let fillColor;
      
      if (aqi >= min) {
        // This segment should be filled with its color
        fillColor = segment.color;
      } else {
        // This segment is beyond current AQI - make it gray
        fillColor = '#e5e7eb';
      }
      
      return {
        name: segment.label,
        value: segment.value,
        color: fillColor,
        range: segment.range
      };
    });
  };

  if (loading) {
    return (
      <div className="aqi-loading">
        <div className="spinner"></div>
        <p>Loading AQI data for {location}...</p>
      </div>
    );
  }

  if (!aqiData) {
    return (
      <div className="aqi-error">
        <p>⚠️ Unable to load AQI data for {location}</p>
        <p style={{ fontSize: '12px', marginTop: '8px', color: '#9ca3af' }}>
          Please check if the location exists in the dataset or try another city.
        </p>
      </div>
    );
  }

  const donutData = createDonutData(aqiData.aqi);
  const aqiColor = getAQIColor(aqiData.aqi);

  // AQI Legend data (Indian Standard)
  const aqiLegend = [
    { range: '0-50', label: 'Good', color: '#4ade80' },
    { range: '50-100', label: 'Satisfactory', color: '#fbbf24' },
    { range: '100-200', label: 'Moderate', color: '#fb923c' },
    { range: '200-300', label: 'Poor', color: '#ef4444' },
    { range: '300-400', label: 'Very Poor', color: '#a855f7' },
    { range: '>400', label: 'Severe', color: '#7c2d12' }
  ];

  return (
    <div className="current-aqi-container">
      <div className="aqi-header-row">
        <div className="aqi-station-name ">{aqiData.location} City</div>
      </div>
      
      <div className="aqi-main-content">
        {/* Donut Chart */}
        <div className="aqi-donut-wrapper">
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={donutData}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={95}
                paddingAngle={2}
                dataKey="value"
                startAngle={90}
                endAngle={450}
              >
                {donutData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Center content */}
          <div className="aqi-center-content">
            <div className="aqi-value" style={{ color: aqiColor }}>
              {aqiData.aqi}
            </div>
            <div className="aqi-label">AQI</div>
            <div className="aqi-category" style={{ color: aqiColor }}>
              {aqiData.category}
            </div>
          </div>
        </div>

        {/* Compact Legend - Side Pointers */}
        <div className="aqi-legend-compact">
          {aqiLegend.map((item, index) => {
            const isActive = aqiData.aqi >= parseInt(item.range.split('-')[0] || item.range.replace('>', ''));
            const inRange = item.range.includes('-') 
              ? (aqiData.aqi >= parseInt(item.range.split('-')[0]) && aqiData.aqi < parseInt(item.range.split('-')[1]))
              : aqiData.aqi >= parseInt(item.range.replace('>', ''));
            
            return (
              <div 
                key={index} 
                className={`legend-pointer ${inRange ? 'current' : ''}`}
                style={{ opacity: isActive ? 1 : 0.4 }}
              >
                <div className="pointer-line" style={{ borderColor: item.color }}></div>
                <div className="pointer-dot" style={{ backgroundColor: item.color }}></div>
                <div className="pointer-label">
                  <span className="pointer-range" style={{ color: inRange ? item.color : '#6b7280' }}>
                    {item.range}
                  </span>
                  <span className="pointer-text" style={{ color: inRange ? item.color : '#9ca3af' }}>
                    {item.label}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default CurrentAQIDonut;
