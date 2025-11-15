import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

function AQIGauge({ data, loading }) {
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!data || data.aqi === undefined) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>No AQI data available</p>
      </div>
    );
  }

  const { aqi, category, dominant_pollutant } = data;

  // AQI Categories and Colors
  const getAQIColor = (value) => {
    if (value <= 50) return '#10b981'; // Good - Green
    if (value <= 100) return '#fbbf24'; // Satisfactory - Yellow
    if (value <= 200) return '#f97316'; // Moderate - Orange
    if (value <= 300) return '#ef4444'; // Poor - Red
    if (value <= 400) return '#991b1b'; // Very Poor - Dark Red
    return '#7f1d1d'; // Severe - Very Dark Red
  };

  const getAQICategory = (value) => {
    if (value <= 50) return 'Good';
    if (value <= 100) return 'Satisfactory';
    if (value <= 200) return 'Moderate';
    if (value <= 300) return 'Poor';
    if (value <= 400) return 'Very Poor';
    return 'Severe';
  };

  const aqiValue = Math.min(aqi, 500);
  const aqiCategory = category || getAQICategory(aqiValue);
  const aqiColor = getAQIColor(aqiValue);

  // Data for donut chart
  const chartData = [
    { name: 'AQI', value: aqiValue },
    { name: 'Remaining', value: 500 - aqiValue }
  ];

  const COLORS = [aqiColor, '#e5e7eb'];

  return (
    <div style={{ position: 'relative' }}>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            startAngle={180}
            endAngle={0}
            innerRadius={80}
            outerRadius={120}
            paddingAngle={0}
            dataKey="value"
            labelLine={false}
            isAnimationActive={true}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center Text Overlay (Alternative to label) */}
      <div style={{
        position: 'absolute',
        top: '35%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{
          fontSize: '48px',
          fontWeight: '700',
          color: aqiColor,
          lineHeight: 1
        }}>
          {Math.round(aqiValue)}
        </div>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#666',
          marginTop: '5px'
        }}>
          AQI
        </div>
        <div style={{
          fontSize: '20px',
          fontWeight: '700',
          color: aqiColor,
          marginTop: '5px'
        }}>
          {aqiCategory}
        </div>
      </div>

      {/* AQI Scale Reference */}
      <div style={{ marginTop: '20px' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '0.85rem',
          color: '#666',
          marginBottom: '8px'
        }}>
          <span>0</span>
          <span>50</span>
          <span>100</span>
          <span>200</span>
          <span>300</span>
          <span>400</span>
          <span>500</span>
        </div>
        <div style={{ 
          height: '12px', 
          background: 'linear-gradient(to right, #10b981 0%, #10b981 10%, #fbbf24 10%, #fbbf24 20%, #f97316 20%, #f97316 40%, #ef4444 40%, #ef4444 60%, #991b1b 60%, #991b1b 80%, #7f1d1d 80%, #7f1d1d 100%)',
          borderRadius: '6px',
          position: 'relative'
        }}>
          {/* Current AQI Indicator */}
          <div style={{
            position: 'absolute',
            left: `${(aqiValue / 500) * 100}%`,
            top: '-8px',
            width: '4px',
            height: '28px',
            background: '#000',
            borderRadius: '2px'
          }}></div>
        </div>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: '#999',
          marginTop: '6px'
        }}>
          <span>Good</span>
          <span>Moderate</span>
          <span>Poor</span>
          <span>Severe</span>
        </div>
      </div>

      {/* Dominant Pollutant */}
      {dominant_pollutant && (
        <div style={{
          marginTop: '15px',
          padding: '10px',
          background: '#f5f5f5',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '4px' }}>
            Dominant Pollutant
          </div>
          <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#424242' }}>
            {dominant_pollutant}
          </div>
        </div>
      )}
    </div>
  );
}

export default AQIGauge;
