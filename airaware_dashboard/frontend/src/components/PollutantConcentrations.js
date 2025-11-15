import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import axios from 'axios';
import './PollutantConcentrations.css';

const PollutantConcentrations = ({ location }) => {
  const [availablePollutants, setAvailablePollutants] = useState([]);
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Pollutant options - ONLY those present in CSV with correct WHO/CPCB limits
  const pollutantConfig = {
    'PM2.5': { 
      color: '#ef4444', 
      limit: 15, 
      limitType: 'WHO',
      label: 'PM2.5 (Fine Particulate Matter)',
      unit: 'µg/m³'
    },
    'NO': { 
      color: '#6366f1', 
      limit: null, 
      limitType: null,
      label: 'NO (Nitric Oxide)',
      unit: 'µg/m³'
    },
    'NO2': { 
      color: '#a855f7', 
      limit: 25, 
      limitType: 'WHO',
      label: 'NO2 (Nitrogen Dioxide)',
      unit: 'µg/m³'
    },
    'NOx': { 
      color: '#8b5cf6', 
      limit: 80, 
      limitType: 'CPCB',
      label: 'NOx (Nitrogen Oxides)',
      unit: 'µg/m³'
    },
    'NH3': { 
      color: '#06b6d4', 
      limit: 400, 
      limitType: 'CPCB',
      label: 'NH3 (Ammonia)',
      unit: 'µg/m³'
    },
    'CO': { 
      color: '#ec4899', 
      limit: 4, 
      limitType: 'WHO',
      label: 'CO (Carbon Monoxide)',
      unit: 'mg/m³'
    },
    'SO2': { 
      color: '#f59e0b', 
      limit: 40, 
      limitType: 'WHO',
      label: 'SO2 (Sulfur Dioxide)',
      unit: 'µg/m³'
    },
    'O3': { 
      color: '#22c55e', 
      limit: 100, 
      limitType: 'WHO/CPCB',
      label: 'O3 (Ozone)',
      unit: 'µg/m³'
    },
    'Benzene': { 
      color: '#14b8a6', 
      limit: 5, 
      limitType: 'CPCB',
      label: 'Benzene',
      unit: 'µg/m³'
    },
    'Toluene': { 
      color: '#f43f5e', 
      limit: null, 
      limitType: null,
      label: 'Toluene',
      unit: 'µg/m³'
    }
  };

  // Get current pollutant info (always computed from config)
  const pollutantInfo = pollutantConfig[selectedPollutant];
  
  // Debug: Log pollutant info
  console.log(`Selected Pollutant: ${selectedPollutant}`, pollutantInfo);

  // Fetch available pollutants on component mount
  useEffect(() => {
    const fetchPollutants = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/air-quality/available-pollutants');
        if (response.data.success) {
          setAvailablePollutants(response.data.pollutants);
        }
      } catch (err) {
        console.error('Error fetching pollutants:', err);
      }
    };

    fetchPollutants();
  }, []);

  // Fetch latest pollutant data for selected pollutant
  const fetchPollutantData = async () => {
    if (!location || !selectedPollutant) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log(`🔄 Fetching ${selectedPollutant} data for ${location}...`);
      
      // Fetch latest data with timeout
      const response = await axios.get('http://localhost:8000/api/air-quality/latest-pollutant', {
        params: {
          city: location,
          pollutant: selectedPollutant
        },
        timeout: 30000 // 30 second timeout
      });

      console.log(`✅ Received ${response.data.count} data points`);

      if (response.data.success) {
        // Format data for Recharts
        const formattedData = response.data.data.map(item => {
          const date = new Date(item.datetime);
          const timeLabel = date.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false
          });

          return {
            time: timeLabel,
            value: item.value
          };
        });

        setChartData(formattedData);
      }
    } catch (err) {
      console.error('❌ Error fetching pollutant data:', err);
      if (err.code === 'ECONNABORTED') {
        setError('Request timeout - the data is taking too long to load');
      } else {
        setError(err.response?.data?.error || 'Failed to fetch data. Please check if backend is running.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch when location or selected pollutant changes
  useEffect(() => {
    if (location) {
      fetchPollutantData();
    }
  }, [location, selectedPollutant]);

  return (
    <div className="pollutant-concentrations">
      {/* Pollutant Dropdown Filter */}
      <div className="pollutant-selector">
        <label>Select Pollutant:</label>
        <select 
          value={selectedPollutant} 
          onChange={(e) => setSelectedPollutant(e.target.value)}
          className="pollutant-dropdown"
        >
          {Object.keys(pollutantConfig).map(pollutant => (
            <option key={pollutant} value={pollutant}>
              {pollutantConfig[pollutant].label}
            </option>
          ))}
        </select>
        <span className="location-indicator">📍 {location}</span>
      </div>

      {/* Chart */}
      <div className="chart-container">
        {loading && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading pollutant data...</p>
          </div>
        )}

        {error && (
          <div className="error-state">
            <span className="error-icon">⚠️</span>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && chartData.length > 0 && (
          <>
            {/* Show info if no limit exists */}
            {pollutantInfo && !pollutantInfo.limit && (
              <div style={{
                padding: '8px 12px',
                background: '#fef3c7',
                border: '1px solid #fcd34d',
                borderRadius: '6px',
                marginBottom: '12px',
                fontSize: '12px',
                color: '#92400e',
                fontWeight: 500,
                textAlign: 'center'
              }}>
                ℹ️ No standard limit defined for {selectedPollutant}
              </div>
            )}
            
            <ResponsiveContainer width="100%" height={380}>
              <LineChart 
                data={chartData} 
                margin={{ top: 30, right: 40, left: 15, bottom: 50 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  interval="preserveStartEnd"
                  height={70}
                  label={{ 
                    value: 'Time', 
                    position: 'insideBottom', 
                    offset: -10,
                    style: { fontSize: 13, fontWeight: 700, fill: '#1f2937' }
                  }}
                />
                <YAxis 
                  width={70}
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  label={{ 
                    value: pollutantInfo ? `Concentration (${pollutantInfo.unit})` : 'Concentration', 
                    angle: -90, 
                    position: 'insideLeft',
                    offset: -5,
                    style: { fontSize: 13, fontWeight: 700, fill: '#1f2937', textAnchor: 'middle' }
                  }}
                  domain={[0, (dataMax) => {
                    // If there's a limit, make sure Y-axis shows at least up to limit + 20%
                    if (pollutantInfo && pollutantInfo.limit) {
                      return Math.max(dataMax, pollutantInfo.limit * 1.2);
                    }
                    return dataMax;
                  }]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'white', 
                    border: '2px solid #e5e7eb', 
                    borderRadius: '8px',
                    fontSize: '13px',
                    padding: '10px 14px'
                  }}
                  labelStyle={{ fontWeight: 700, color: '#374151', marginBottom: '4px' }}
                  formatter={(value, name) => {
                    if (name === `${selectedPollutant} Level`) {
                      return [`${value.toFixed(2)} ${pollutantInfo.unit}`, pollutantInfo.label];
                    }
                    return [value, name];
                  }}
                />
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '13px', 
                    fontWeight: 600,
                    paddingTop: '18px',
                    paddingBottom: '4px'
                  }}
                  iconType="line"
                  iconSize={20}
                  formatter={(value) => {
                    if (value === `${selectedPollutant} Level`) {
                      return `${pollutantInfo.label} - Current Levels`;
                    }
                    return value;
                  }}
                />
                
                {/* Standard Limit Reference Line - Only if limit exists */}
                {pollutantInfo && pollutantInfo.limit && (
                  <>
                    {console.log('✅ Rendering limit line:', pollutantInfo.limitType, 'Limit:', pollutantInfo.limit, pollutantInfo.unit)}
                    <ReferenceLine 
                      y={pollutantInfo.limit} 
                      stroke="#dc2626" 
                      strokeWidth={3}
                      strokeDasharray="10 5"
                      ifOverflow="extendDomain"
                      label={{ 
                        value: `${pollutantInfo.limitType} Limit: ${pollutantInfo.limit} ${pollutantInfo.unit}`, 
                        position: 'top', 
                        fill: '#dc2626',
                        fontSize: 12,
                        fontWeight: 'bold',
                        offset: 15,
                        style: {
                          background: 'white',
                          padding: '4px 8px',
                          borderRadius: '4px'
                        }
                      }}
                    />
                  </>
                )}
                
                {/* Pollutant Line */}
                <Line 
                  type="monotone" 
                  dataKey="value" 
                  stroke={pollutantConfig[selectedPollutant].color} 
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: pollutantConfig[selectedPollutant].color }}
                  activeDot={{ r: 6 }}
                  name={`${selectedPollutant} Level`}
                />
              </LineChart>
            </ResponsiveContainer>
          </>
        )}

        {!loading && !error && chartData.length === 0 && (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>No recent data available for {selectedPollutant}</p>
            <small>Data for {location}</small>
          </div>
        )}
      </div>
    </div>
  );
};

export default PollutantConcentrations;
