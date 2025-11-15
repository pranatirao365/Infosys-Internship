import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';

function PollutantTrendsChart({ location }) {
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState(null);
  const [selectedPollutants, setSelectedPollutants] = useState(['PM2.5', 'NO2', 'O3']);

  // All available pollutants from CSV
  const allPollutants = ['PM2.5', 'NO', 'NO2', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene'];

  useEffect(() => {
    if (location) {
      fetchPollutantTrends();
    }
  }, [location]);

  const fetchPollutantTrends = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get('http://localhost:8000/api/forecast/pollutant-trends', {
        params: { city: location },
        timeout: 10000
      });

      if (response.data.success && response.data.trends) {
        setChartData(response.data.trends);
        setMetadata(response.data.metadata);
        console.log('✅ Loaded pollutant trends:', response.data);
      } else {
        console.warn('No trends data, using fallback');
        setChartData(generateFallbackData());
      }
    } catch (error) {
      console.error('Error fetching pollutant trends:', error);
      // Use fallback data
      setChartData(generateFallbackData());
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback data if API not available
  const generateFallbackData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return days.map((day, index) => {
      const baseValue = 40 + Math.random() * 20;
      const trend = Math.sin(index * 0.5) * 15;
      
      return {
        day: day,
        'PM2.5': Math.max(10, baseValue + trend + (Math.random() - 0.5) * 10),
        'NO': Math.max(5, (baseValue * 0.6) + trend + (Math.random() - 0.5) * 8),
        'NO2': Math.max(5, (baseValue * 0.7) + trend + (Math.random() - 0.5) * 8),
        'NOx': Math.max(5, (baseValue * 0.75) + (Math.random() - 0.5) * 12),
        'NH3': Math.max(3, (baseValue * 0.4) + (Math.random() - 0.5) * 6),
        'CO': Math.max(2, (baseValue * 0.3) + (Math.random() - 0.5) * 4),
        'SO2': Math.max(3, (baseValue * 0.5) + (Math.random() - 0.5) * 6),
        'O3': Math.max(5, (baseValue * 0.8) + (Math.random() - 0.5) * 12),
        'Benzene': Math.max(1, (baseValue * 0.2) + (Math.random() - 0.5) * 3),
        'Toluene': Math.max(1, (baseValue * 0.25) + (Math.random() - 0.5) * 3)
      };
    });
  };

  const togglePollutant = (pollutant) => {
    if (selectedPollutants.includes(pollutant)) {
      // Remove if already selected (but keep at least one)
      if (selectedPollutants.length > 1) {
        setSelectedPollutants(selectedPollutants.filter(p => p !== pollutant));
      }
    } else {
      // Add if not selected
      setSelectedPollutants([...selectedPollutants, pollutant]);
    }
  };

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="loading-spinner"></div>
        <span style={{ marginLeft: '10px', color: '#666' }}>Training model on latest 100 data points...</span>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>No trend data available</p>
        <small>Select a location and click Update Dashboard</small>
      </div>
    );
  }

  // Pollutant colors - all 10 pollutants from CSV
  const pollutantColors = {
    'PM2.5': '#3b82f6',    // Blue
    'NO': '#10b981',       // Green
    'NO2': '#06b6d4',      // Cyan
    'NOx': '#8b5cf6',      // Purple
    'NH3': '#ec4899',      // Pink
    'CO': '#f59e0b',       // Orange
    'SO2': '#ef4444',      // Red
    'O3': '#14b8a6',       // Teal
    'Benzene': '#a855f7',  // Violet
    'Toluene': '#f97316'   // Deep Orange
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: 'white',
          padding: '12px',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: '#424242', fontWeight: '700' }}>
            {label}
          </p>
          {payload.map((entry, index) => (
            <p key={index} style={{ 
              margin: '4px 0', 
              fontSize: '0.85rem', 
              color: entry.color,
              fontWeight: '600'
            }}>
              {entry.name}: {entry.value.toFixed(2)} µg/m³
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      {/* Pollutant Selection Checkboxes */}
      <div style={{
        marginBottom: '15px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '12px',
        alignItems: 'center'
      }}>
        <span style={{ fontWeight: '600', color: '#424242', fontSize: '0.9rem', marginRight: '8px' }}>
          Select Pollutants:
        </span>
        {allPollutants.map(pollutant => {
          const isSelected = selectedPollutants.includes(pollutant);
          const color = pollutantColors[pollutant];
          
          return (
            <label
              key={pollutant}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                cursor: 'pointer',
                padding: '6px 12px',
                borderRadius: '6px',
                background: isSelected ? color : 'white',
                color: isSelected ? 'white' : '#666',
                border: `2px solid ${color}`,
                fontWeight: isSelected ? '700' : '500',
                fontSize: '0.85rem',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = `${color}20`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.background = 'white';
                }
              }}
            >
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => togglePollutant(pollutant)}
                style={{
                  width: '16px',
                  height: '16px',
                  cursor: 'pointer',
                  accentColor: color
                }}
              />
              {pollutant}
            </label>
          );
        })}
      </div>

     
      <ResponsiveContainer width="100%" height={280}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="day"
            tick={{ fontSize: 12, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <YAxis 
            label={{ 
              value: 'Concentration (µg/m³)', 
              angle: -90, 
              position: 'outsideLeft', 
              style: { fontSize: 11, fill: '#666' } 
            }}
            tick={{ fontSize: 11, fill: '#666' }}
            axisLine={{ stroke: '#e0e0e0' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }}
            iconType="line"
          />
          
          {/* Render only selected pollutants - all 10 pollutants */}
          {selectedPollutants.includes('PM2.5') && (
            <Line
              type="monotone"
              dataKey="PM2.5"
              stroke={pollutantColors['PM2.5']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['PM2.5'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('NO') && (
            <Line
              type="monotone"
              dataKey="NO"
              stroke={pollutantColors['NO']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['NO'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('NO2') && (
            <Line
              type="monotone"
              dataKey="NO2"
              stroke={pollutantColors['NO2']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['NO2'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('NOx') && (
            <Line
              type="monotone"
              dataKey="NOx"
              stroke={pollutantColors['NOx']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['NOx'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('NH3') && (
            <Line
              type="monotone"
              dataKey="NH3"
              stroke={pollutantColors['NH3']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['NH3'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('CO') && (
            <Line
              type="monotone"
              dataKey="CO"
              stroke={pollutantColors['CO']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['CO'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('SO2') && (
            <Line
              type="monotone"
              dataKey="SO2"
              stroke={pollutantColors['SO2']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['SO2'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('O3') && (
            <Line
              type="monotone"
              dataKey="O3"
              stroke={pollutantColors['O3']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['O3'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('Benzene') && (
            <Line
              type="monotone"
              dataKey="Benzene"
              stroke={pollutantColors['Benzene']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['Benzene'] }}
              activeDot={{ r: 6 }}
            />
          )}
          {selectedPollutants.includes('Toluene') && (
            <Line
              type="monotone"
              dataKey="Toluene"
              stroke={pollutantColors['Toluene']}
              strokeWidth={2.5}
              dot={{ r: 4, fill: pollutantColors['Toluene'] }}
              activeDot={{ r: 6 }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {/* Pollutant Summary - only show selected pollutants */}
      <div style={{
        marginTop: '15px',
        padding: '12px',
        background: '#f9fafb',
        borderRadius: '8px',
        display: 'grid',
        gridTemplateColumns: `repeat(${selectedPollutants.length}, 1fr)`,
        gap: '10px'
      }}>
        {selectedPollutants.map(pollutant => {
          const color = pollutantColors[pollutant];
          const avgValue = chartData.reduce((sum, day) => sum + (day[pollutant] || 0), 0) / chartData.length;
          return (
            <div key={pollutant} style={{ textAlign: 'center' }}>
              <div style={{ 
                width: '100%',
                height: '4px',
                background: color,
                borderRadius: '2px',
                marginBottom: '6px'
              }}></div>
              <div style={{ fontSize: '0.75rem', color: '#666', marginBottom: '2px' }}>
                {pollutant}
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: '700', color: color }}>
                {avgValue.toFixed(1)}
              </div>
              <div style={{ fontSize: '0.65rem', color: '#999' }}>
                avg µg/m³
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default PollutantTrendsChart;
