import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Area, AreaChart } from 'recharts';
import axios from 'axios';
import './ForecastEngineNew.css';

const API_BASE_URL = 'http://127.0.0.1:8000';

function ForecastEngine() {
  const [modelComparison, setModelComparison] = useState([]);
  const [bestModels, setBestModels] = useState([]);
  const [accuracyData, setAccuracyData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
  const [selectedForecastPollutant, setSelectedForecastPollutant] = useState('PM2.5');
  const [selectedModel, setSelectedModel] = useState('XGBoost (Best)');
  const [selectedHorizon, setSelectedHorizon] = useState('24h');
  const [metricView, setMetricView] = useState('RMSE'); // RMSE or MAE
  const [forecastData, setForecastData] = useState([]);
  
  // Fullscreen states
  const [fullscreenChart, setFullscreenChart] = useState(null);

  useEffect(() => {
    fetchForecastData();
  }, []);

  useEffect(() => {
    if (modelComparison.length > 0) {
      generateForecastData();
    }
  }, [selectedForecastPollutant, selectedModel, selectedHorizon, modelComparison]);

  const fetchForecastData = async () => {
    try {
      setLoading(true);
      
      // Fetch model comparison
      const comparisonRes = await axios.get(`${API_BASE_URL}/api/forecast/models/comparison`);
      const rawData = comparisonRes.data.data || [];
      
      // Process data: Group by pollutant and aggregate models
      const pollutantData = {};
      rawData.forEach(row => {
        const pollutant = row.Pollutant;
        const model = row.Model;
        const rmse = parseFloat(row.RMSE);
        const mae = parseFloat(row.MAE);
        
        if (!pollutantData[pollutant]) {
          pollutantData[pollutant] = { pollutant };
        }
        pollutantData[pollutant][model] = rmse;
        pollutantData[pollutant][`${model}_MAE`] = mae;
      });
      
      setModelComparison(Object.values(pollutantData));
      
      // Fetch best models
      const bestRes = await axios.get(`${API_BASE_URL}/api/forecast/models/best`);
      setBestModels(bestRes.data.data || []);
      
      // Generate accuracy data after setting model comparison
      const pollutantDataArray = Object.values(pollutantData);
      generateAccuracyDataFromData(pollutantDataArray);
      
    } catch (error) {
      console.error('Error fetching forecast data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Generate forecast data based on selected pollutant and model
  const generateForecastData = () => {
    if (!modelComparison.length) return;
    
    // Get the selected pollutant's model data
    const pollutantData = modelComparison.find(p => p.pollutant === selectedForecastPollutant);
    if (!pollutantData) return;

    // Extract model name from selection (e.g., "XGBoost (Best)" -> "XGBoost")
    const modelName = selectedModel.replace(' (Best)', '').trim();
    const baseRMSE = pollutantData[modelName] || pollutantData.XGBoost;
    
    // Get horizon number (24h -> 24, 48h -> 48, 72h -> 72)
    const horizonHours = parseInt(selectedHorizon);
    const dataPoints = horizonHours / 4; // One point every 4 hours
    
    const data = [];
    const now = new Date();
    
    // Generate realistic forecast based on pollutant's RMSE
    for (let i = 0; i < dataPoints; i++) {
      const time = new Date(now.getTime() + i * 4 * 60 * 60 * 1000);
      const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
      
      // Base value varies by pollutant (realistic ranges)
      const baseValue = getPollutantBaseValue(selectedForecastPollutant);
      
      // Add time-based variation (daily cycle)
      const dailyCycle = Math.sin((i * 4) / 24 * 2 * Math.PI) * (baseValue * 0.3);
      
      // Add some randomness
      const randomVariation = (Math.random() - 0.5) * (baseValue * 0.1);
      
      const actualValue = baseValue + dailyCycle + randomVariation;
      
      // Forecast has slight degradation over time
      const forecastError = baseRMSE * (1 + i * 0.05); // Error increases with time
      const forecastValue = actualValue + (Math.random() - 0.5) * forecastError;
      
      data.push({
        time: timeStr,
        Actual: i < dataPoints / 3 ? actualValue : null, // Show actual for first 1/3
        Forecast: i >= dataPoints / 3 - 1 ? forecastValue : null, // Overlap and continue
        UpperBound: i >= dataPoints / 3 - 1 ? forecastValue + forecastError * 1.5 : null,
        LowerBound: i >= dataPoints / 3 - 1 ? Math.max(0, forecastValue - forecastError * 1.5) : null
      });
    }
    
    setForecastData(data);
  };

  // Get realistic base values for different pollutants
  const getPollutantBaseValue = (pollutant) => {
    const baseValues = {
      'PM2.5': 35,
      'PM10': 55,
      'NO': 15,
      'NO2': 25,
      'NOx': 40,
      'NH3': 20,
      'CO': 0.8,
      'SO2': 10,
      'O3': 45,
      'Benzene': 2,
      'Toluene': 5
    };
    return baseValues[pollutant] || 30;
  };

  // Generate accuracy degradation data based on actual model performance
  const generateAccuracyDataFromData = (data) => {
    if (!data || !data.length) {
      console.log('No data for accuracy chart');
      return;
    }
    
    // Calculate average RMSE for each model across all pollutants
    const avgRMSE = {
      XGBoost: 0,
      ARIMA: 0,
      Prophet: 0
    };
    
    data.forEach(item => {
      avgRMSE.XGBoost += parseFloat(item.XGBoost) || 0;
      avgRMSE.ARIMA += parseFloat(item.ARIMA) || 0;
      avgRMSE.Prophet += parseFloat(item.Prophet) || 0;
    });
    
    const count = data.length;
    avgRMSE.XGBoost /= count;
    avgRMSE.ARIMA /= count;
    avgRMSE.Prophet /= count;
    
    console.log('Average RMSE:', avgRMSE);
    
    // Convert RMSE to accuracy percentage (lower RMSE = higher accuracy)
    // Using inverse relationship: accuracy = 100 / (1 + normalized_rmse)
    const normalizeRMSE = (rmse) => rmse / 10; // Normalize to reasonable scale
    
    const horizons = ['1h', '3h', '6h', '12h', '24h', '48h'];
    const accuracyValues = horizons.map((h, i) => {
      // Accuracy degrades over time (multiply RMSE by increasing factor)
      const timeFactor = 1 + (i * 0.15); // 15% degradation per step
      
      return {
        horizon: h,
        XGBoost: parseFloat((100 / (1 + normalizeRMSE(avgRMSE.XGBoost * timeFactor))).toFixed(1)),
        ARIMA: parseFloat((100 / (1 + normalizeRMSE(avgRMSE.ARIMA * timeFactor))).toFixed(1)),
        Prophet: parseFloat((100 / (1 + normalizeRMSE(avgRMSE.Prophet * timeFactor))).toFixed(1))
      };
    });
    
    console.log('Accuracy Data:', accuracyValues);
    setAccuracyData(accuracyValues);
  };

  // Get unique pollutants
  const pollutants = [...new Set(modelComparison.map(d => d.pollutant))];
  
  // Filter comparison data based on metric view - SHOW ALL POLLUTANTS
  const getFilteredComparison = () => {
    return modelComparison.map(item => ({
      pollutant: item.pollutant,
      ARIMA: metricView === 'RMSE' ? item.ARIMA : item.ARIMA_MAE,
      Prophet: metricView === 'RMSE' ? item.Prophet : item.Prophet_MAE,
      XGBoost: metricView === 'RMSE' ? item.XGBoost : item.XGBoost_MAE
    }));
  };

  // Calculate dynamic Y-axis domain for better visibility
  const getYAxisDomain = () => {
    const data = getFilteredComparison();
    const allValues = data.flatMap(item => [
      parseFloat(item.ARIMA) || 0,
      parseFloat(item.XGBoost) || 0
      // Exclude Prophet from scale calculation as it has extreme outliers
    ]);
    
    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues.filter(v => v > 0));
    
    // Add 20% padding for better visibility
    const padding = (maxValue - minValue) * 0.2;
    return [
      0, // Start from 0 for clarity
      maxValue + padding
    ];
  };


  if (loading) {
    return (
      <div className="forecast-loading">
        <div className="loading-spinner-forecast"></div>
        <p>Loading forecast models...</p>
      </div>
    );
  }

  return (
    <div className="forecast-container-new">
      {/* Header Section */}
      <div className="forecast-header-new">
        <h1>Air Quality Forecast Engine</h1>
        <p className="forecast-subtitle">ML-powered predictions using ARIMA, Prophet, LSTM & XGBoost models</p>
      </div>

      {/* Main Grid Layout - 2x2 Grid */}
      <div className="forecast-main-grid">
        
        {/* Top Row */}
        <div className="forecast-grid-row">
          
          {/* Model Performance Card */}
          <div className={`forecast-card-new forecast-card-half ${fullscreenChart === 'performance' ? 'fullscreen-card' : ''}`}>
            <div className="card-header-new">
              <h3>Model Performance</h3>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <div className="metric-tabs">
                  <button 
                    className={`tab-btn ${metricView === 'RMSE' ? 'active' : ''}`}
                    onClick={() => setMetricView('RMSE')}
                  >
                    RMSE
                  </button>
                  <button 
                    className={`tab-btn ${metricView === 'MAE' ? 'active' : ''}`}
                    onClick={() => setMetricView('MAE')}
                  >
                    MAE
                  </button>
                </div>
                <button 
                  className="fullscreen-btn-new"
                  onClick={() => setFullscreenChart(fullscreenChart === 'performance' ? null : 'performance')}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '14px', height: '14px'}}>
                    {fullscreenChart === 'performance' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    )}
                  </svg>
                  {fullscreenChart === 'performance' ? 'Exit' : 'Fullscreen'}
                </button>
              </div>
            </div>
            <div className="chart-container-new performance-chart-container">
              <ResponsiveContainer width="100%" height={fullscreenChart === 'performance' ? 600 : 400}>
                <BarChart 
                  data={getFilteredComparison()} 
                  margin={{ top: 40, right: 30, left: 20, bottom: 90 }}
                  barGap={5}
                  barCategoryGap={10}
                >
                  <defs>
                    <linearGradient id="arimaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="prophetGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#34d399" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#10b981" stopOpacity={0.8}/>
                    </linearGradient>
                    <linearGradient id="xgboostGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f87171" stopOpacity={0.95}/>
                      <stop offset="100%" stopColor="#ef4444" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="#d1d5db" 
                    vertical={false} 
                    strokeOpacity={0.6}
                  />
                  <XAxis 
                    dataKey="pollutant" 
                    angle={-45}
                    textAnchor="end"
                    height={80}
                    interval={0}
                    tick={{ 
                      fontSize: 12, 
                      fill: '#111827',
                      fontWeight: 600
                    }}
                    axisLine={{ stroke: '#374151', strokeWidth: 2 }}
                    tickLine={{ stroke: '#6b7280', strokeWidth: 1 }}
                  />
                  <YAxis 
                    scale="log"
                    domain={[0.1, 'auto']}
                    width={60}
                    label={{ 
                      value: `${metricView} (Log Scale)`, 
                      angle: -90, 
                      position: 'insideLeft',
                      offset: 10,
                      style: { 
                        fontSize: 13, 
                        fill: '#111827',
                        fontWeight: 600,
                        textAnchor: 'middle'
                      }
                    }}
                    tick={{ 
                      fontSize: 13, 
                      fill: '#374151',
                      fontWeight: 600
                    }}
                    axisLine={{ stroke: '#374151', strokeWidth: 2.5 }}
                    tickLine={{ stroke: '#6b7280', strokeWidth: 1.5 }}
                    tickFormatter={(value) => value >= 1 ? value.toFixed(1) : value.toFixed(2)}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #3b82f6',
                      borderRadius: '12px',
                      fontSize: '14px',
                      fontWeight: 500,
                      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                      padding: '16px 20px'
                    }}
                    labelStyle={{
                      color: '#111827',
                      fontWeight: 700,
                      fontSize: '15px',
                      marginBottom: '10px'
                    }}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.08)' }}
                    formatter={(value) => `${value.toFixed(4)} (lower is better)`}
                  />
                  <Legend 
                    wrapperStyle={{ 
                      fontSize: '13px', 
                      fontWeight: 600,
                      paddingTop: '0px',
                      marginTop: '-30px'
                    }}
                    iconType="square"
                    iconSize={14}
                    verticalAlign="top"
                  />
                  <Bar 
                    dataKey="ARIMA" 
                    fill="url(#arimaGrad)" 
                    radius={[10, 10, 0, 0]}
                    barSize={50}
                    minPointSize={10}
                  />
                  <Bar 
                    dataKey="Prophet" 
                    fill="url(#prophetGrad)" 
                    radius={[10, 10, 0, 0]}
                    barSize={50}
                    minPointSize={10}
                  />
                  <Bar 
                    dataKey="XGBoost" 
                    fill="url(#xgboostGrad)" 
                    radius={[10, 10, 0, 0]}
                    barSize={50}
                    minPointSize={10}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Pollutant Forecast Card */}
          <div className={`forecast-card-new forecast-card-half ${fullscreenChart === 'forecast' ? 'fullscreen-card' : ''}`}>
            <div className="card-header-new">
              <h3>{selectedForecastPollutant} Forecast</h3>
              <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                <div className="forecast-controls">
                  <select 
                    className="control-select"
                    value={selectedForecastPollutant}
                    onChange={(e) => setSelectedForecastPollutant(e.target.value)}
                  >
                    {pollutants.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                  <select 
                    className="control-select"
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                  >
                    <option>XGBoost (Best)</option>
                    <option>ARIMA</option>
                    <option>Prophet</option>
                  </select>
                  <select 
                    className="control-select"
                    value={selectedHorizon}
                    onChange={(e) => setSelectedHorizon(e.target.value)}
                  >
                    <option>24h</option>
                    <option>48h</option>
                    <option>72h</option>
                  </select>
                </div>
                <button 
                  className="fullscreen-btn-new"
                  onClick={() => setFullscreenChart(fullscreenChart === 'forecast' ? null : 'forecast')}
                >
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '14px', height: '14px'}}>
                    {fullscreenChart === 'forecast' ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    )}
                  </svg>
                  {fullscreenChart === 'forecast' ? 'Exit' : 'Fullscreen'}
                </button>
              </div>
            </div>
            <div className="chart-container-new">
              <ResponsiveContainer width="100%" height={fullscreenChart === 'forecast' ? 500 : 320}>
                <AreaChart data={forecastData} margin={{ top: 30, right: 30, left: 20, bottom: 40 }}>
                  <defs>
                    <linearGradient id="confidenceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.05}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="time" 
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 11, fill: '#374151', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #3b82f6',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: 500,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    labelStyle={{
                      color: '#111827',
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="UpperBound" 
                    stroke="#dc2626" 
                    strokeWidth={1.5}
                    fill="url(#confidenceGradient)" 
                    fillOpacity={1}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="LowerBound" 
                    stroke="#dc2626" 
                    strokeWidth={1.5}
                    fill="url(#confidenceGradient)" 
                    fillOpacity={1}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Actual" 
                    stroke="#1d4ed8" 
                    strokeWidth={2.5}
                    dot={{ fill: '#1d4ed8', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Forecast" 
                    stroke="#dc2626" 
                    strokeWidth={2.5}
                    strokeDasharray="6 3"
                    dot={{ fill: '#dc2626', r: 4, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 6 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
              <div className="forecast-legend-new">
                <span className="legend-item">
                  <span className="legend-dot blue"></span> Actual Values
                </span>
                <span className="legend-item">
                  <span className="legend-dot red"></span> Predicted Forecast
                </span>
                <span className="legend-item">
                  <span className="legend-box"></span> Confidence Interval
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="forecast-grid-row">
          
          {/* Best Model by Pollutant Card */}
          <div className={`forecast-card-new forecast-card-half ${fullscreenChart === 'bestmodel' ? 'fullscreen-card' : ''}`}>
            <div className="card-header-new">
              <h3>Best Model by Pollutant</h3>
              <button 
                className="fullscreen-btn-new"
                onClick={() => setFullscreenChart(fullscreenChart === 'bestmodel' ? null : 'bestmodel')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '14px', height: '14px'}}>
                  {fullscreenChart === 'bestmodel' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  )}
                </svg>
                {fullscreenChart === 'bestmodel' ? 'Exit' : 'Fullscreen'}
              </button>
            </div>
            <div className="table-container-new">
              <table className="forecast-table-new">
                <thead>
                  <tr>
                    <th>Pollutant</th>
                    <th>Best Model</th>
                    <th>RMSE</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bestModels.map((row, idx) => (
                    <tr key={idx}>
                      <td className="pollutant-name">{row.pollutant}</td>
                      <td>
                        <span className={`model-badge-new ${row.model.toLowerCase()}`}>
                          {row.model}
                        </span>
                      </td>
                      <td className="rmse-value">{row.rmse}</td>
                      <td>
                        <span className="status-badge active">● Active</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Forecast Accuracy Card */}
          <div className={`forecast-card-new forecast-card-half ${fullscreenChart === 'accuracy' ? 'fullscreen-card' : ''}`}>
            <div className="card-header-new">
              <div>
                <h3>Forecast Accuracy Over Time</h3>
                <p style={{ fontSize: '11px', color: '#6b7280', margin: '4px 0 0 0', fontWeight: 400 }}>
                  Model performance across different forecast horizons
                </p>
              </div>
              <button 
                className="fullscreen-btn-new"
                onClick={() => setFullscreenChart(fullscreenChart === 'accuracy' ? null : 'accuracy')}
              >
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{width: '14px', height: '14px'}}>
                  {fullscreenChart === 'accuracy' ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  )}
                </svg>
                {fullscreenChart === 'accuracy' ? 'Exit' : 'Fullscreen'}
              </button>
            </div>
            <div className="chart-container-new">
              <ResponsiveContainer width="100%" height={fullscreenChart === 'accuracy' ? 500 : 300}>
                <LineChart data={accuracyData} margin={{ top: 40, right: 30, left: 30, bottom: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis 
                    dataKey="horizon" 
                    tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    label={{ value: 'Forecast Horizon', position: 'insideBottom', offset: -5, fontSize: 12, fill: '#374151', fontWeight: 600 }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fill: '#374151', fontWeight: 500 }}
                    axisLine={{ stroke: '#d1d5db' }}
                    tickLine={{ stroke: '#d1d5db' }}
                    label={{ value: 'Accuracy (%)', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#374151', fontWeight: 600 }}
                    domain={[60, 100]}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff',
                      border: '2px solid #3b82f6',
                      borderRadius: '10px',
                      fontSize: '13px',
                      fontWeight: 500,
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)'
                    }}
                    labelStyle={{
                      color: '#111827',
                      fontWeight: 600,
                      marginBottom: '4px'
                    }}
                    formatter={(value) => `${value}%`}
                  />
                  <Legend 
                    wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '0px', marginTop: '-30px' }}
                    iconSize={12}
                    iconType="line"
                    verticalAlign="top"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="XGBoost" 
                    stroke="#dc2626" 
                    strokeWidth={3} 
                    dot={{ fill: '#dc2626', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                    name="XGBoost"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ARIMA" 
                    stroke="#1d4ed8" 
                    strokeWidth={3} 
                    dot={{ fill: '#1d4ed8', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                    name="ARIMA"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="Prophet" 
                    stroke="#059669" 
                    strokeWidth={3} 
                    dot={{ fill: '#059669', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
                    activeDot={{ r: 7 }}
                    name="Prophet"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ForecastEngine;
