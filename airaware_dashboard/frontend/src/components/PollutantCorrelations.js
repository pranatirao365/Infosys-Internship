import React, { useState } from 'react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function PollutantCorrelations({ data, selectedPollutants }) {
  const activePollutants = selectedPollutants && selectedPollutants.length > 0 
    ? selectedPollutants.filter(p => p !== 'AQI')
    : ['PM2.5', 'NO2'];
  
  const [xPollutant, setXPollutant] = useState(activePollutants[0] || 'PM2.5');
  const [yPollutant, setYPollutant] = useState(activePollutants[1] || 'NO2');
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!data || data.length === 0) {
    return (
      <>
        <div className="card-header">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Pollutant Correlations
        </div>
        <p style={{textAlign: 'center', padding: '2rem', color: '#999'}}>No data available for correlation analysis</p>
      </>
    );
  }

  // Helper to get PM2.5 value
  const getPM25 = (item) => {
    if (item.PM2 && typeof item.PM2 === 'object' && item.PM2['5'] !== undefined) {
      return item.PM2['5'];
    }
    return item['PM2.5'] || null;
  };

  // Helper to get pollutant value dynamically
  const getPollutantValue = (item, pollutant) => {
    if (pollutant === 'PM2.5') return getPM25(item);
    return item[pollutant] || null;
  };

  // Calculate correlation coefficient
  const calculateCorrelation = (x, y) => {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return denominator === 0 ? 0 : numerator / denominator;
  };

  // Prepare correlation data for selected pollutants
  const validData = data.filter(item => {
    const xVal = getPollutantValue(item, xPollutant);
    const yVal = getPollutantValue(item, yPollutant);
    return xVal !== null && !isNaN(xVal) && xVal > 0 &&
           yVal !== null && !isNaN(yVal) && yVal > 0;
  });

  if (validData.length < 2) {
    return (
      <>
        <div className="card-header">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
          </svg>
          Pollutant Correlations
        </div>
        <div className="empty-state">
          <h3>Insufficient Data</h3>
          <p>Need at least 2 valid data points for correlation analysis</p>
        </div>
      </>
    );
  }

  // Sample data for performance (limit to 500 points)
  const sampledData = validData.length > 500 
    ? validData.filter((_, index) => index % Math.ceil(validData.length / 500) === 0)
    : validData;

  const correlationData = sampledData.map(item => ({
    x: getPollutantValue(item, xPollutant),
    y: getPollutantValue(item, yPollutant),
    datetime: item.Datetime
  }));

  const xValues = correlationData.map(d => d.x);
  const yValues = correlationData.map(d => d.y);
  const correlation = calculateCorrelation(xValues, yValues);

  const colors = {
    'PM2.5': '#4caf50', 'PM10': '#2196f3', 'NO': '#ff9800', 'NO2': '#f44336',
    'NOx': '#9c27b0', 'NH3': '#00bcd4', 'CO': '#795548', 'SO2': '#e91e63',
    'O3': '#3f51b5', 'Benzene': '#ff5722', 'Toluene': '#607d8b'
  };

  return (
    <>
      <div className={`${isFullscreen ? 'fullscreen-card' : ''}`}>
      <div className="card-header">
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        Pollutant Correlations
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <select 
            value={xPollutant} 
            onChange={(e) => setXPollutant(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '2px solid #4caf50',
              background: 'white',
              color: '#2e7d32',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {activePollutants.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <span style={{ color: '#666', fontWeight: '600' }}>vs</span>
          <select 
            value={yPollutant} 
            onChange={(e) => setYPollutant(e.target.value)}
            style={{
              padding: '6px 10px',
              borderRadius: '6px',
              border: '2px solid #4caf50',
              background: 'white',
              color: '#2e7d32',
              fontSize: '0.85rem',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {activePollutants.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              padding: '6px 12px',
              background: '#f5f5f5',
              color: '#666',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.8rem',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.background = '#e8e8e8';
              e.currentTarget.style.borderColor = '#ccc';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = '#f5f5f5';
              e.currentTarget.style.borderColor = '#ddd';
            }}
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '14px', height: '14px'}}>
              {isFullscreen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              )}
            </svg>
            {isFullscreen ? 'Exit' : 'Fullscreen'}
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={isFullscreen ? 650 : 360}>
        <ScatterChart margin={{ top: 10, right: 20, bottom: 60, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" strokeWidth={0.5} />
          <XAxis 
            type="number"
            dataKey="x" 
            name={xPollutant}
            tick={{fontSize: 8, fill: '#333', fontWeight: 500}}
            stroke="#999"
            strokeWidth={0.5}
            label={{ 
              value: `${xPollutant} Concentration (µg/m³)`, 
              position: 'insideBottom', 
              offset: -10,
              style: { fontSize: 11, fill: '#333', fontWeight: 600 }
            }}
          />
          <YAxis 
            type="number"
            dataKey="y" 
            name={yPollutant}
            tick={{fontSize: 8, fill: '#333', fontWeight: 500}}
            stroke="#999"
            strokeWidth={0.5}
            width={50}
            label={{ 
              value: `${yPollutant} Concentration (µg/m³)`, 
              angle: -90, 
              position: 'insideLeft',
              offset: 10,
              style: { fontSize: 11, fill: '#333', fontWeight: 600, textAnchor: 'middle' }
            }}
          />
          <Tooltip 
            cursor={{ strokeDasharray: '3 3', stroke: '#999', strokeWidth: 1 }}
            contentStyle={{
              background: 'white',
              border: '1px solid #ddd',
              borderRadius: '4px',
              padding: '6px 10px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}
            labelStyle={{
              color: '#000',
              fontWeight: 600,
              marginBottom: '3px',
              fontSize: '10px'
            }}
            itemStyle={{
              color: '#333',
              fontSize: '9px'
            }}
            formatter={(value) => value.toFixed(2)}
          />
          <Scatter 
            name={`${xPollutant} vs ${yPollutant}`}
            data={correlationData} 
            fill={colors[xPollutant] || '#4caf50'}
            fillOpacity={0.6}
            shape="circle"
            animationDuration={800}
            animationEasing="ease-out"
          />
        </ScatterChart>
      </ResponsiveContainer>
      </div>
      {isFullscreen && (
        <div 
          onClick={() => setIsFullscreen(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0,0,0,0.7)',
            zIndex: 998
          }}
        />
      )}
    </>
  );
}

export default PollutantCorrelations;
