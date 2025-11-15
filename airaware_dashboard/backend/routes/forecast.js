const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// Load pre-computed forecast data
let forecastData = null;
let pollutantTrendsData = null;

const loadForecastData = () => {
  try {
    const forecastPath = path.join(__dirname, '../../ml_service/precomputed-forecasts.json');
    const data = fs.readFileSync(forecastPath, 'utf8');
    forecastData = JSON.parse(data);
    console.log('✅ Loaded pre-computed forecasts for', Object.keys(forecastData).length, 'cities');
  } catch (error) {
    console.error('❌ Error loading forecast data:', error.message);
    forecastData = {};
  }
  
  // Load pollutant trends forecast - try backend/data first, then ml_service
  try {
    let trendsPath = path.join(__dirname, '../data/precomputed-pollutant-trends.json');
    
    // If not in backend/data, try ml_service
    if (!fs.existsSync(trendsPath)) {
      trendsPath = path.join(__dirname, '../../ml_service/precomputed-pollutant-trends.json');
    }
    
    const data = fs.readFileSync(trendsPath, 'utf8');
    pollutantTrendsData = JSON.parse(data);
    console.log('✅ Loaded pollutant trends forecasts for', Object.keys(pollutantTrendsData.forecasts || {}).length, 'cities');
    console.log('📍 Pollutant trends loaded from:', trendsPath);
  } catch (error) {
    console.error('❌ Error loading pollutant trends data:', error.message);
    pollutantTrendsData = null;
  }
};

// Load forecasts on startup
loadForecastData();

// Helper function to read CSV files
const readCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
};

// Get model comparison results (POLLUTANT-BASED)
router.get('/models/comparison', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../../ml_service/model_comparison_pollutant_results.csv');
    const data = await readCSV(csvPath);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error reading model comparison:', error);
    res.status(500).json({ error: 'Failed to load model comparison data' });
  }
});

// Get ARIMA results (POLLUTANT-BASED)
router.get('/models/arima', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../../ml_service/arima_pollutant_results.csv');
    const data = await readCSV(csvPath);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error reading ARIMA results:', error);
    res.status(500).json({ error: 'Failed to load ARIMA data' });
  }
});

// Get Prophet results (POLLUTANT-BASED)
router.get('/models/prophet', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../../ml_service/prophet_pollutant_results.csv');
    const data = await readCSV(csvPath);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error reading Prophet results:', error);
    res.status(500).json({ error: 'Failed to load Prophet data' });
  }
});

// Get XGBoost results (POLLUTANT-BASED)
router.get('/models/xgboost', async (req, res) => {
  try {
    const csvPath = path.join(__dirname, '../../ml_service/xgboost_pollutant_results.csv');
    const data = await readCSV(csvPath);
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error reading XGBoost results:', error);
    res.status(500).json({ error: 'Failed to load XGBoost data' });
  }
});

// Get best model per POLLUTANT
router.get('/models/best', async (req, res) => {
  try {
    const arimaPath = path.join(__dirname, '../../ml_service/arima_pollutant_results.csv');
    const prophetPath = path.join(__dirname, '../../ml_service/prophet_pollutant_results.csv');
    const xgboostPath = path.join(__dirname, '../../ml_service/xgboost_pollutant_results.csv');
    
    const arimaData = await readCSV(arimaPath);
    const prophetData = await readCSV(prophetPath);
    const xgboostData = await readCSV(xgboostPath);
    
    // Compare and find best model per POLLUTANT
    const bestModels = [];
    const pollutantMap = {};
    
    arimaData.forEach(row => {
      const pollutant = row.Pollutant;
      const rmse = parseFloat(row.RMSE);
      pollutantMap[pollutant] = { 
        pollutant, 
        model: 'ARIMA', 
        rmse: rmse.toFixed(4), 
        mae: parseFloat(row.MAE).toFixed(4), 
        status: 'Active' 
      };
    });
    
    prophetData.forEach(row => {
      const pollutant = row.Pollutant;
      const rmse = parseFloat(row.RMSE);
      if (!pollutantMap[pollutant] || rmse < parseFloat(pollutantMap[pollutant].rmse)) {
        pollutantMap[pollutant] = { 
          pollutant, 
          model: 'Prophet', 
          rmse: rmse.toFixed(4), 
          mae: parseFloat(row.MAE).toFixed(4), 
          status: 'Active' 
        };
      }
    });
    
    xgboostData.forEach(row => {
      const pollutant = row.Pollutant;
      const rmse = parseFloat(row.RMSE);
      if (!pollutantMap[pollutant] || rmse < parseFloat(pollutantMap[pollutant].rmse)) {
        pollutantMap[pollutant] = { 
          pollutant, 
          model: 'XGBoost', 
          rmse: rmse.toFixed(4), 
          mae: parseFloat(row.MAE).toFixed(4), 
          status: 'Active' 
        };
      }
    });
    
    Object.values(pollutantMap).forEach(entry => bestModels.push(entry));
    
    res.json({ success: true, data: bestModels });
  } catch (error) {
    console.error('Error calculating best models:', error);
    res.status(500).json({ error: 'Failed to calculate best models' });
  }
});

// ============================================
// 7-DAY FORECAST ENDPOINT USING XGBOOST MODEL
// ============================================

const axios = require('axios');
const CSV_FILE_PATH = path.join(__dirname, '../../ml_service/city_hour_final.csv');

// ML Service URL (FastAPI service running on port 8001)
const ML_SERVICE_URL = 'http://localhost:8001';

// Helper function to get day name
function getDayName(date) {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

// Helper function to format date
function formatDate(date) {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

// Get recent historical data for a city
async function getRecentData(city, hoursBack = 168) { // Last 7 days = 168 hours
  return new Promise((resolve, reject) => {
    const historicalData = [];
    let rowCount = 0;
    let cityRowCount = 0;
    const MAX_CITY_ROWS = 500; // Stop after finding enough city data

    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;

        if (row.City === city && row.Datetime) {
          cityRowCount++;
          
          historicalData.push({
            date: new Date(row.Datetime),
            PM2_5: parseFloat(row['PM2.5']) || 0,
            PM10: parseFloat(row.PM10) || 0,
            NO: parseFloat(row.NO) || 0,
            NO2: parseFloat(row.NO2) || 0,
            NOx: parseFloat(row.NOx) || 0,
            NH3: parseFloat(row.NH3) || 0,
            CO: parseFloat(row.CO) || 0,
            SO2: parseFloat(row.SO2) || 0,
            O3: parseFloat(row.O3) || 0,
            Benzene: parseFloat(row.Benzene) || 0,
            Toluene: parseFloat(row.Toluene) || 0,
            Xylene: parseFloat(row.Xylene) || 0
          });
          
          // Stop after collecting enough city data
          if (cityRowCount >= MAX_CITY_ROWS) {
            console.log(`✅ Collected ${cityRowCount} records for ${city}, stopping CSV read`);
            return; // Stop reading CSV
          }
        }
      })
      .on('end', () => {
        if (historicalData.length === 0) {
          return reject(new Error(`No historical data found for ${city}`));
        }

        // Sort by date and get most recent data
        historicalData.sort((a, b) => b.date - a.date);
        const recentData = historicalData.slice(0, hoursBack);
        
        console.log(`📊 Loaded ${recentData.length} recent records for ${city}`);
        resolve(recentData);
      })
      .on('error', (error) => reject(error));
  });
}

// Prepare features for XGBoost model prediction
function prepareForecastFeatures(historicalData, forecastDate) {
  // Calculate statistics from recent data
  const pm25Values = historicalData.map(d => d.PM2_5).filter(v => v > 0);
  const pm10Values = historicalData.map(d => d.PM10).filter(v => v > 0);
  const no2Values = historicalData.map(d => d.NO2).filter(v => v > 0);
  const so2Values = historicalData.map(d => d.SO2).filter(v => v > 0);
  const o3Values = historicalData.map(d => d.O3).filter(v => v > 0);
  const coValues = historicalData.map(d => d.CO).filter(v => v > 0);
  
  const avg = (arr) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  
  return {
    date: forecastDate.toISOString(),
    year: forecastDate.getFullYear(),
    month: forecastDate.getMonth() + 1,
    day: forecastDate.getDate(),
    day_of_week: forecastDate.getDay(),
    hour: 12, // Predict for midday
    PM2_5: avg(pm25Values),
    PM10: avg(pm10Values),
    NO2: avg(no2Values),
    SO2: avg(so2Values),
    O3: avg(o3Values),
    CO: avg(coValues),
    NO: avg(historicalData.map(d => d.NO).filter(v => v > 0)),
    NOx: avg(historicalData.map(d => d.NOx).filter(v => v > 0)),
    NH3: avg(historicalData.map(d => d.NH3).filter(v => v > 0)),
    Benzene: avg(historicalData.map(d => d.Benzene).filter(v => v > 0)),
    Toluene: avg(historicalData.map(d => d.Toluene).filter(v => v > 0)),
    Xylene: avg(historicalData.map(d => d.Xylene).filter(v => v > 0))
  };
}

// Predict AQI using XGBoost model via ML service
async function predictWithXGBoost(city, days = 7) {
  try {
    // Check if ML service is available
    const healthCheck = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 2000 });
    
    if (!healthCheck.data.model_loaded) {
      throw new Error('XGBoost model not loaded in ML service');
    }

    console.log('✅ ML Service is healthy, model loaded');

    // Get recent historical data
    const historicalData = await getRecentData(city);

    // Prepare features for next 7 days
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const forecastFeatures = [];
    for (let i = 1; i <= days; i++) {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + i);
      forecastFeatures.push(prepareForecastFeatures(historicalData, forecastDate));
    }

    // Call ML service for prediction
    console.log(`🤖 Calling XGBoost model for ${city} (${days} days)...`);
    
    const predictionResponse = await axios.post(
      `${ML_SERVICE_URL}/predict`,
      {
        data: forecastFeatures
      },
      { timeout: 10000 }
    );

    if (predictionResponse.data.error) {
      throw new Error(predictionResponse.data.error);
    }

    const predictions = predictionResponse.data.predictions;
    
    // Format predictions for frontend
    const forecast = predictions.map((aqi, index) => {
      const forecastDate = new Date(today);
      forecastDate.setDate(today.getDate() + index + 1);
      
      return {
        date: formatDate(forecastDate),
        day: getDayName(forecastDate).substring(0, 3),
        aqi: Math.round(Math.max(0, Math.min(500, aqi)) * 10) / 10 // Clamp and round
      };
    });

    console.log(`✅ XGBoost predictions generated for ${city}:`, forecast);
    return forecast;

  } catch (error) {
    console.error('❌ XGBoost prediction failed:', error.message);
    
    // Fallback to simple statistical prediction if ML service unavailable
    console.log('⚠️ Falling back to statistical prediction...');
    return await fallbackPrediction(city, days);
  }
}

// Fallback statistical prediction (in case ML service is down)
async function fallbackPrediction(city, days = 7) {
  const historicalData = await getRecentData(city, 168); // Last 7 days
  
  // Calculate average AQI from recent PM2.5 values (simplified)
  const pm25Values = historicalData.map(d => d.PM2_5).filter(v => v > 0);
  const avgPM25 = pm25Values.reduce((a, b) => a + b, 0) / pm25Values.length;
  
  // Simple AQI estimation from PM2.5
  const estimateAQI = (pm25) => {
    if (pm25 <= 30) return (50 / 30) * pm25;
    if (pm25 <= 60) return 50 + ((100 - 50) / (60 - 30)) * (pm25 - 30);
    if (pm25 <= 90) return 100 + ((200 - 100) / (90 - 60)) * (pm25 - 60);
    if (pm25 <= 120) return 200 + ((300 - 200) / (120 - 90)) * (pm25 - 90);
    if (pm25 <= 250) return 300 + ((400 - 300) / (250 - 120)) * (pm25 - 120);
    return 400 + ((500 - 400) / (380 - 250)) * (pm25 - 250);
  };
  
  const baseAQI = estimateAQI(avgPM25);
  
  // Generate predictions with small variations
  const predictions = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 1; i <= days; i++) {
    const forecastDate = new Date(today);
    forecastDate.setDate(today.getDate() + i);
    
    const variation = (Math.random() - 0.5) * 0.15; // ±7.5% variation
    const predictedAQI = Math.max(0, Math.min(500, baseAQI * (1 + variation)));
    
    predictions.push({
      date: formatDate(forecastDate),
      day: getDayName(forecastDate).substring(0, 3),
      aqi: Math.round(predictedAQI * 10) / 10
    });
  }
  
  return predictions;
}

// GET /api/forecast/7-day?city=Delhi
router.get('/7-day', async (req, res) => {
  try {
    const { city } = req.query;

    if (!city) {
      return res.status(400).json({
        success: false,
        error: 'City parameter is required'
      });
    }

    console.log(`🔮 Fetching pre-computed forecast for ${city}...`);
    
    // Get forecast from pre-computed data
    const forecast = forecastData[city];

    if (!forecast) {
      console.log(`⚠️ No forecast found for ${city}, available cities:`, Object.keys(forecastData));
      return res.status(404).json({
        success: false,
        error: `No forecast available for ${city}. Available cities: ${Object.keys(forecastData).join(', ')}`
      });
    }

    console.log(`✅ Found forecast for ${city}:`, forecast);

    res.json({
      success: true,
      city: city,
      forecast: forecast,
      model: 'XGBoost (Pre-computed)',
      generated: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Forecast error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve forecast'
    });
  }
});

// Get Pollutant Trends Forecast (Trained on latest 100 data points)
router.get('/pollutant-trends', (req, res) => {
  try {
    const { city } = req.query;

    if (!pollutantTrendsData || !pollutantTrendsData.forecasts) {
      return res.status(503).json({
        success: false,
        error: 'Pollutant trends data not available. Run generate_pollutant_trends.py first.'
      });
    }

    // If city specified, return that city's trends
    if (city) {
      const cityTrends = pollutantTrendsData.forecasts[city];
      
      if (!cityTrends) {
        return res.status(404).json({
          success: false,
          error: `No trends available for ${city}`,
          availableCities: Object.keys(pollutantTrendsData.forecasts)
        });
      }

      return res.json({
        success: true,
        city: city,
        trends: cityTrends.trends,
        metadata: {
          ...cityTrends.metadata,
          trainedOn: cityTrends.trainedOn,
          forecastDays: cityTrends.forecastDays,
          pollutants: cityTrends.pollutants
        }
      });
    }

    // Return all trends with metadata
    res.json({
      success: true,
      metadata: pollutantTrendsData.metadata,
      cities: Object.keys(pollutantTrendsData.forecasts),
      forecasts: pollutantTrendsData.forecasts
    });

  } catch (error) {
    console.error('❌ Pollutant trends error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to retrieve pollutant trends'
    });
  }
});

module.exports = router;
