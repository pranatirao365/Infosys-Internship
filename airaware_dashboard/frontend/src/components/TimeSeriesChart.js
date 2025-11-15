import React, { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

function TimeSeriesChart({ data, selectedPollutants }) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  if (!data || data.length === 0) {
    return (
      <>
        <div className="card-header">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Time Series Analysis
        </div>
        <div className="empty-state">
          <h3>No Data Available</h3>
          <p>Select filters and click "Apply Filters" to view time series</p>
        </div>
      </>
    );
  }

  // Helper to get PM2.5 value (handle nested structure)
  const getPM25 = (item) => {
    if (item.PM2 && typeof item.PM2 === 'object' && item.PM2['5'] !== undefined) {
      return item.PM2['5'];
    }
    if (item['PM2.5'] !== undefined) {
      return item['PM2.5'];
    }
    return null;
  };

  // Helper to get pollutant value
  const getPollutantValue = (item, pollutant) => {
    if (pollutant === 'PM2.5') return getPM25(item);
    return item[pollutant] || null;
  };

  // Process data for time series with dynamic date formatting based on time range
  const getDateFormat = (dataLength) => {
    if (dataLength <= 24) return (dt) => new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    if (dataLength <= 168) return (dt) => new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    if (dataLength <= 720) return (dt) => new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric' });
    return (dt) => new Date(dt).toLocaleString('en-US', { year: 'numeric', month: 'short' });
  };

  const sampleSize = Math.min(data.length, 100);
  const sampleStep = Math.max(1, Math.floor(data.length / sampleSize));
  const formatDate = getDateFormat(data.length);

  const processedData = data
    .filter((_, index) => index % sampleStep === 0)
    .map(item => {
      const dataPoint = {
        datetime: formatDate(item.Datetime)
      };
      
      // Add each selected pollutant
      if (selectedPollutants && selectedPollutants.length > 0) {
        selectedPollutants.forEach(pollutant => {
          dataPoint[pollutant] = getPollutantValue(item, pollutant) || 0;
        });
      } else {
        // Default to PM2.5 if no pollutants selected
        dataPoint['PM2.5'] = getPM25(item) || 0;
      }
      
      return dataPoint;
    });

  // Color palette for different pollutants
  const colors = {
    'PM2.5': '#4caf50',
    'PM10': '#2196f3',
    'NO': '#ff9800',
    'NO2': '#f44336',
    'NOx': '#9c27b0',
    'NH3': '#00bcd4',
    'CO': '#795548',
    'SO2': '#e91e63',
    'O3': '#3f51b5',
    'Benzene': '#ff5722',
    'Toluene': '#607d8b',
    'AQI': '#8bc34a'
  };

  const activePollutants = selectedPollutants && selectedPollutants.length > 0 
    ? selectedPollutants 
    : ['PM2.5'];

  return (
    <>
      <div className={`${isFullscreen ? 'fullscreen-card' : ''}`}>
        <div className="card-header">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Time Series Analysis
          <button 
            onClick={() => setIsFullscreen(!isFullscreen)}
            style={{
              marginLeft: 'auto',
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
      <ResponsiveContainer width="100%" height={isFullscreen ? 650 : 360}>
        <LineChart data={processedData} margin={{ top: 30, right: 20, bottom: 100, left: 50 }}>
          <defs>
            {activePollutants.map((pollutant) => (
              <linearGradient key={`gradient-${pollutant}`} id={`gradient-${pollutant}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors[pollutant] || '#888'} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={colors[pollutant] || '#888'} stopOpacity={0}/>
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" strokeWidth={0.5} />
          <XAxis 
            dataKey="datetime" 
            tick={{fontSize: 7, fill: '#333', fontWeight: 500, dy: 10}}
            angle={-45}
            textAnchor="end"
            height={75}
            stroke="#999"
            strokeWidth={0.5}
            interval={Math.max(3, Math.floor(processedData.length / 4))}
          />
          <YAxis 
            tick={{fontSize: 8, fill: '#333', fontWeight: 500, dx: -5}}
            stroke="#999"
            strokeWidth={0.5}
            width={50}
            label={{ 
              value: 'Concentration (µg/m³)', 
              angle: -90, 
              position: 'insideLeft',
              offset: 5,
              style: { fontSize: 9, fill: '#333', fontWeight: 600, textAnchor: 'middle' }
            }}
          />
          <Tooltip 
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
          />
          <Legend 
            wrapperStyle={{fontSize: '8px', paddingTop: '0px', marginTop: '-25px', color: '#000'}}
            iconType="line"
            iconSize={10}
            verticalAlign="top"
            height={40}
          />
          {activePollutants.map((pollutant, index) => (
            <Line 
              key={pollutant}
              type="monotone" 
              dataKey={pollutant} 
              stroke={colors[pollutant] || `hsl(${index * 60}, 70%, 50%)`}
              strokeWidth={1.5}
              dot={false}
              activeDot={{ r: 4, fill: colors[pollutant] || `hsl(${index * 60}, 70%, 50%)`, stroke: '#fff', strokeWidth: 2 }}
              name={`${pollutant} (µg/m³)`}
              animationDuration={800}
              animationEasing="ease-out"
            />
          ))}
        </LineChart>
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

export default TimeSeriesChart;
