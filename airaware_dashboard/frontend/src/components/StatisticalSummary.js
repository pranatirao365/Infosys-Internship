import React, { useState } from 'react';

function StatisticalSummary({ data, selectedPollutants }) {
  const activePollutants = selectedPollutants && selectedPollutants.length > 0 
    ? selectedPollutants 
    : ['PM2.5'];
  
  const [viewPollutant, setViewPollutant] = useState(activePollutants[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!data || data.length === 0) {
    return (
      <>
        <div className="card-header">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Statistical Summary
        </div>
        <div className="empty-state">
          <h3>No Data Available</h3>
          <p>Select filters and click "Apply Filters" to view statistical summary</p>
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

  // Calculate statistics for a pollutant
  const calculateStats = (pollutant) => {
    const values = data
      .map(d => getPollutantValue(d, pollutant))
      .filter(v => v != null && !isNaN(v) && v >= 0);
    
    if (values.length === 0) {
      return null;
    }
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const sortedValues = [...values].sort((a, b) => a - b);
    const median = sortedValues[Math.floor(sortedValues.length / 2)];
    const max = Math.max(...values);
    const min = Math.min(...values);
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, median, max, min, stdDev, count: values.length };
  };

  const stats = calculateStats(viewPollutant);

  return (
    <>
      <div className={`${isFullscreen ? 'fullscreen-card' : ''}`}>
      <div className="card-header" style={{ display: 'flex', alignItems: 'center' }}>
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
        Statistical Summary
        <select 
          value={viewPollutant} 
          onChange={(e) => setViewPollutant(e.target.value)}
          style={{
            marginLeft: 'auto',
            padding: '8px 12px',
            borderRadius: '8px',
            border: '2px solid #4caf50',
            background: 'white',
            color: '#2e7d32',
            fontSize: '0.9rem',
            fontWeight: '600',
            cursor: 'pointer',
            outline: 'none',
            marginRight: '10px'
          }}
        >
          {activePollutants.map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
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

      {!stats ? (
        <div className="empty-state">
          <h3>No Valid Data</h3>
          <p>No valid {viewPollutant} measurements found in the selected data range</p>
        </div>
      ) : (
        <div className="stats-grid" style={{ animation: 'fadeIn 0.5s ease-in' }}>
          <div className="stat-box">
            <div className="stat-value">{stats.mean.toFixed(2)}</div>
            <div className="stat-label">Mean</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.median.toFixed(2)}</div>
            <div className="stat-label">Median</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.max.toFixed(2)}</div>
            <div className="stat-label">Max</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.min.toFixed(2)}</div>
            <div className="stat-label">Min</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.stdDev.toFixed(2)}</div>
            <div className="stat-label">Std Dev</div>
          </div>
          <div className="stat-box">
            <div className="stat-value">{stats.count.toLocaleString()}</div>
            <div className="stat-label">Count</div>
          </div>
        </div>
      )}
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

export default StatisticalSummary;
