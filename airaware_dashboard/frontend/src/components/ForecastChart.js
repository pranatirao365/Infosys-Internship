import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

function ForecastChart({ location, pollutant, timeRange, forecastHorizon, loading }) {
  const [chartData, setChartData] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    if (location && pollutant) {
      fetchData();
    }
  }, [location, pollutant, timeRange, forecastHorizon]);

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert time range to hours
      const hoursMap = {
        '24h': 24,
        '7d': 168,
        '30d': 720
      };
      const hours = hoursMap[timeRange] || 24;

      // Convert forecast horizon to days
      const daysMap = {
        '24h': 1,
        '7d': 7,
        '14d': 14
      };
      const days = daysMap[forecastHorizon] || 7;

      const response = await fetch(
        `http://localhost:8000/api/air-quality/historical-forecast?city=${location}&pollutant=${pollutant}&hours=${hours}&forecastDays=${days}`
      );

      const data = await response.json();

      if (data.success) {
        console.log('✅ API Response:', data); // Debug log
        console.log('📊 Historical points:', data.historical?.length);
        console.log('📈 Forecast points:', data.forecast?.length);
        console.log('🔍 Sample historical data:', data.historical?.slice(0, 3));
        console.log('🔍 Sample forecast data:', data.forecast);
        
        const processedData = processChartData(data.historical, data.forecast);
        setChartData(processedData);
      } else {
        setError(data.error || 'Failed to load data');
      }
    } catch (err) {
      console.error('Error fetching forecast data:', err);
      setError('Failed to load forecast data');
    } finally {
      setIsLoading(false);
    }
  };

  const processChartData = (historical, forecast) => {
    const chartData = [];

    // Add historical data - intelligently sample based on data size
    if (historical && historical.length > 0) {
      let processedHistorical = [];
      
      // For 24 hours: show all hourly points (up to 24)
      if (historical.length <= 24) {
        processedHistorical = historical;
      } 
      // For 7 days (168 hours): sample every 6 hours (28 points)
      else if (historical.length <= 168) {
        const step = Math.ceil(historical.length / 28);
        for (let i = 0; i < historical.length; i += step) {
          processedHistorical.push(historical[i]);
        }
      }
      // For 30 days (720 hours): sample every day (30 points)
      else {
        const step = Math.ceil(historical.length / 30);
        for (let i = 0; i < historical.length; i += step) {
          processedHistorical.push(historical[i]);
        }
      }
      
      // Add processed historical points
      processedHistorical.forEach((point) => {
        chartData.push({
          time: formatDateTime(point.datetime, 'historical'),
          historical: point.value,
          forecast: null,
          type: 'historical'
        });
      });
      
      // Add connecting point - use the ACTUAL last point from full data
      const lastHistorical = historical[historical.length - 1];
      chartData.push({
        time: formatDateTime(lastHistorical.datetime, 'historical'),
        historical: null,
        forecast: lastHistorical.value, // Connect forecast line to last historical point
        type: 'connection'
      });
    }

    // Add forecast data - all forecast points
    if (forecast && forecast.length > 0) {
      console.log('📊 Forecast data received:', forecast); // Debug log
      
      forecast.forEach((point, index) => {
        // Format forecast as "D+1", "D+2", etc. for better clarity
        const dayLabel = `D+${point.day || index + 1}`;
        
        chartData.push({
          time: dayLabel,
          historical: null,
          forecast: point.value,
          type: 'forecast',
          day: point.day
        });
      });
      
      console.log('📈 Total chart points:', chartData.length); // Debug log
    }

    return chartData;
  };

  const formatDateTime = (datetime, dataType) => {
    const date = new Date(datetime);
    const hours = date.getHours();
    const minutes = date.getMinutes();
    
    // For historical data, show time
    const timeStr = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    return timeStr;
  };

  if (loading || isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid #e0e0e0',
          borderTop: '3px solid #2e7d32',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }}></div>
        <span style={{ marginLeft: '10px', color: '#666', fontSize: '0.9rem' }}>Loading forecast...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>⚠️ {error}</p>
        <small>Please check if the city exists in the dataset</small>
      </div>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>
        <p>No forecast data available</p>
        <small>Select a location and click Update Dashboard</small>
      </div>
    );
  }

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const value = payload[0].value;
      const type = payload[0].dataKey;
      
      return (
        <div style={{
          background: 'white',
          padding: '10px',
          border: '2px solid #e0e0e0',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: '0 0 5px 0', fontSize: '0.85rem', color: '#666' }}>
            {label}
          </p>
          <p style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: type === 'historical' ? '#3b82f6' : '#f97316' }}>
            {type === 'historical' ? 'Historical' : 'Forecast'}: {value?.toFixed(2)} µg/m³
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="time"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            angle={-15}
            textAnchor="end"
            height={60}
          />
          <YAxis 
            label={{ value: `${pollutant} (µg/m³)`, angle: -90, position: 'insideLeft', style: { fontSize: 12 } }}
            tick={{ fontSize: 11 }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="historical"
            name="Historical"
            stroke="#3b82f6"
            strokeWidth={2.5}
            dot={{ r: 3, fill: '#3b82f6' }}
            connectNulls={true}
            activeDot={{ r: 6 }}
          />
          <Line
            type="monotone"
            dataKey="forecast"
            name="Forecast"
            stroke="#f97316"
            strokeWidth={2.5}
            strokeDasharray="5 5"
            dot={{ r: 4, fill: '#f97316' }}
            connectNulls={true}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Forecast Summary */}
      {chartData && chartData.length > 0 && (
        <div style={{
          marginTop: '15px',
          padding: '12px',
          background: '#fff7ed',
          borderRadius: '8px',
          border: '1px solid #fed7aa'
        }}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '10px',
            fontSize: '0.85rem'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Min Forecast</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#2e7d32' }}>
                {Math.min(...chartData.filter(d => d.forecast !== null).map(d => d.forecast || 0)).toFixed(1)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Avg Forecast</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#f97316' }}>
                {(chartData.filter(d => d.forecast !== null).reduce((sum, d) => sum + (d.forecast || 0), 0) / 
                  chartData.filter(d => d.forecast !== null).length).toFixed(1)}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ color: '#666', marginBottom: '4px' }}>Max Forecast</div>
              <div style={{ fontSize: '1.1rem', fontWeight: '700', color: '#ef4444' }}>
                {Math.max(...chartData.filter(d => d.forecast !== null).map(d => d.forecast || 0)).toFixed(1)}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ForecastChart;
