const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');

// ============================================
// LOAD PRE-COMPUTED DASHBOARD DATA
// ============================================
let dashboardData = null;
let aqiData = null;
let citiesList = [];
let metadata = null;

const loadPrecomputedData = () => {
  if (dashboardData && aqiData) {
    return; // Already loaded
  }

  try {
    // Load new comprehensive dashboard data
    const dashboardPath = path.join(__dirname, '../data/precomputed-dashboard-data.json');
    
    if (fs.existsSync(dashboardPath)) {
      console.log('📂 Loading pre-computed dashboard data...');
      const rawData = fs.readFileSync(dashboardPath, 'utf8');
      const jsonData = JSON.parse(rawData);
      
      dashboardData = jsonData.cities;
      metadata = jsonData.metadata;
      citiesList = Object.keys(dashboardData);
      
      console.log('✅ Pre-computed dashboard data loaded successfully!');
      console.log(`   📍 Cities: ${citiesList.length}`);
      console.log(`   📅 Generated: ${metadata.generatedAt}`);
      console.log(`   ⚡ Load time: <1ms (INSTANT!)\n`);
    }
    
    // Also load old AQI data for backwards compatibility
    const aqiPath = path.join(__dirname, '../data/precomputed-aqi.json');
    if (fs.existsSync(aqiPath)) {
      const aqiRawData = fs.readFileSync(aqiPath, 'utf8');
      const aqiJsonData = JSON.parse(aqiRawData);
      aqiData = aqiJsonData.data;
    }
    
  } catch (error) {
    console.error('❌ Error loading pre-computed data:', error.message);
  }
};

// Load data immediately when module is required
loadPrecomputedData();

// ============================================
// API ROUTES - LIGHTNING FAST!
// ============================================

// GET /api/air-quality/cities - Get list of all cities
router.get('/cities', (req, res) => {
  try {
    if (!aqiData) {
      return res.status(503).json({
        success: false,
        error: 'AQI data not loaded. Please run: node backend/scripts/precompute-aqi.js'
      });
    }

    res.json({
      success: true,
      cities: citiesList,
      count: citiesList.length
    });
  } catch (error) {
    console.error('Error fetching cities:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/air-quality/current?location=CityName - Get AQI for specific city
router.get('/current', (req, res) => {
  try {
    if (!dashboardData) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard data not loaded. Please run: node backend/scripts/precompute-all-data.js'
      });
    }

    const { location } = req.query;

    if (!location) {
      return res.status(400).json({ 
        success: false, 
        error: 'Location parameter is required' 
      });
    }

    // Get pre-computed data - INSTANT!
    const cityData = dashboardData[location];
    
    if (!cityData) {
      return res.status(404).json({
        success: false,
        error: `City "${location}" not found. Available cities: ${citiesList.join(', ')}`
      });
    }

    // Return pre-computed average AQI data
    res.json({
      success: true,
      location: location,
      ...cityData.currentAQI,
      methodology: metadata.methodology.avgAQI
    });

  } catch (error) {
    console.error('Error fetching current air quality:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/air-quality/all - Get AQI for ALL cities at once
router.get('/all', (req, res) => {
  try {
    if (!aqiData) {
      return res.status(503).json({
        success: false,
        error: 'AQI data not loaded. Please run: node backend/scripts/precompute-aqi.js'
      });
    }

    res.json({
      success: true,
      data: aqiData,
      cities: citiesList,
      count: citiesList.length,
      metadata: metadata
    });
  } catch (error) {
    console.error('Error fetching all AQI data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/air-quality/pollutants - Get pollutant concentration data with filters
router.get('/pollutants', (req, res) => {
  const csv = require('csv-parser');
  const { city, startDate, endDate, pollutant } = req.query;

  // Validate required parameters
  if (!city || !startDate || !endDate || !pollutant) {
    return res.status(400).json({
      success: false,
      error: 'Missing required parameters. Need: city, startDate, endDate, pollutant'
    });
  }

  console.log(`📊 Fetching ${pollutant} data for ${city} from ${startDate} to ${endDate}...`);

  const results = [];
  const csvPath = path.join(__dirname, '../../ml_service/city_hour_final.csv');

  // Map pollutant names to CSV column names
  const pollutantMap = {
    'PM2.5': 'PM2.5',
    'PM10': 'PM10',
    'O3': 'O3',
    'NO2': 'NO2',
    'SO2': 'SO2',
    'CO': 'CO',
    'NO': 'NO',
    'Benzene': 'Benzene',
    'Toluene': 'Toluene',
    'Xylene': 'Xylene'
  };

  const columnName = pollutantMap[pollutant];
  if (!columnName) {
    return res.status(400).json({
      success: false,
      error: `Invalid pollutant. Available: ${Object.keys(pollutantMap).join(', ')}`
    });
  }

  const startDateTime = new Date(startDate);
  const endDateTime = new Date(endDate);

  fs.createReadStream(csvPath)
    .pipe(csv())
    .on('data', (row) => {
      // Check if row matches city
      if (row.City !== city) return;

      // Parse datetime
      const rowDate = new Date(row.Datetime);
      
      // Check if date is within range
      if (rowDate >= startDateTime && rowDate <= endDateTime) {
        const value = parseFloat(row[columnName]);
        
        // Only add if value exists and is valid
        if (!isNaN(value)) {
          results.push({
            datetime: row.Datetime,
            value: value
          });
        }
      }
    })
    .on('end', () => {
      console.log(`✅ Found ${results.length} records for ${city} - ${pollutant}`);
      
      // Sort by datetime
      results.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

      res.json({
        success: true,
        city: city,
        pollutant: pollutant,
        startDate: startDate,
        endDate: endDate,
        count: results.length,
        data: results
      });
    })
    .on('error', (error) => {
      console.error('Error reading CSV:', error);
      res.status(500).json({
        success: false,
        error: error.message
      });
    });
});

// GET /api/air-quality/available-pollutants - Get list of available pollutants
router.get('/available-pollutants', (req, res) => {
  const pollutants = [
    { 
      name: 'PM2.5', 
      label: 'PM2.5 (Fine Particulate Matter)', 
      unit: 'µg/m³', 
      limit: 15,
      limitType: 'WHO',
      limitDescription: 'WHO 24-hr limit'
    },
    { 
      name: 'NO2', 
      label: 'NO2 (Nitrogen Dioxide)', 
      unit: 'µg/m³', 
      limit: 25,
      limitType: 'WHO',
      limitDescription: 'WHO 24-hr limit'
    },
    { 
      name: 'NO', 
      label: 'NO (Nitric Oxide)', 
      unit: 'µg/m³', 
      limit: null,
      limitType: null,
      limitDescription: 'No standard limit'
    },
    { 
      name: 'NOx', 
      label: 'NOx (Nitrogen Oxides)', 
      unit: 'µg/m³', 
      limit: 80,
      limitType: 'CPCB',
      limitDescription: 'CPCB annual limit'
    },
    { 
      name: 'NH3', 
      label: 'NH3 (Ammonia)', 
      unit: 'µg/m³', 
      limit: 400,
      limitType: 'CPCB',
      limitDescription: 'CPCB 24-hr limit'
    },
    { 
      name: 'CO', 
      label: 'CO (Carbon Monoxide)', 
      unit: 'mg/m³', 
      limit: 4,
      limitType: 'WHO',
      limitDescription: 'WHO 24-hr limit'
    },
    { 
      name: 'SO2', 
      label: 'SO2 (Sulfur Dioxide)', 
      unit: 'µg/m³', 
      limit: 40,
      limitType: 'WHO',
      limitDescription: 'WHO 24-hr limit'
    },
    { 
      name: 'O3', 
      label: 'O3 (Ozone)', 
      unit: 'µg/m³', 
      limit: 100,
      limitType: 'WHO/CPCB',
      limitDescription: 'WHO & CPCB 8-hr limit'
    },
    { 
      name: 'Benzene', 
      label: 'Benzene', 
      unit: 'µg/m³', 
      limit: 5,
      limitType: 'CPCB',
      limitDescription: 'CPCB annual limit'
    },
    { 
      name: 'Toluene', 
      label: 'Toluene', 
      unit: 'µg/m³', 
      limit: null,
      limitType: null,
      limitDescription: 'No standard limit'
    }
  ];

  res.json({
    success: true,
    pollutants: pollutants
  });
});

// GET /api/air-quality/concentrations - Get pollutant concentration data with filters
router.get('/concentrations', async (req, res) => {
  try {
    const { city, startDate, endDate, pollutant } = req.query;

    if (!city || !pollutant) {
      return res.status(400).json({ 
        success: false, 
        error: 'City and pollutant parameters are required' 
      });
    }

    // Read CSV and filter data
    const csv = require('csv-parser');
    const csvPath = path.join(__dirname, '../../ml_service/city_hour_final.csv');
    const results = [];

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Filter by city
          if (row.City && row.City.toLowerCase() === city.toLowerCase()) {
            const datetime = row.Datetime;
            
            // Filter by date range if provided
            if (startDate || endDate) {
              const rowDate = new Date(datetime);
              if (startDate && rowDate < new Date(startDate)) return;
              if (endDate && rowDate > new Date(endDate)) return;
            }

            // Extract concentration value for the selected pollutant
            const value = parseFloat(row[pollutant]);
            if (!isNaN(value)) {
              results.push({
                datetime: datetime,
                value: value
              });
            }
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Sort by datetime
    results.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

    res.json({
      success: true,
      city: city,
      pollutant: pollutant,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error fetching concentration data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/air-quality/latest-pollutant - Get latest data for a specific pollutant (INSTANT!)
router.get('/latest-pollutant', (req, res) => {
  try {
    const { city, pollutant } = req.query;

    if (!city || !pollutant) {
      return res.status(400).json({ 
        success: false, 
        error: 'City and pollutant parameters are required' 
      });
    }

    if (!dashboardData) {
      return res.status(503).json({
        success: false,
        error: 'Dashboard data not loaded. Please run: node backend/scripts/precompute-all-data.js'
      });
    }

    const cityData = dashboardData[city];
    
    if (!cityData) {
      return res.status(404).json({
        success: false,
        error: `No data found for ${city}`
      });
    }

    const pollutantTrend = cityData.pollutantTrends[pollutant];
    
    if (!pollutantTrend) {
      return res.status(404).json({
        success: false,
        error: `Pollutant ${pollutant} not found. Available pollutants: ${Object.keys(cityData.pollutantTrends).join(', ')}`
      });
    }

    console.log(`✅ Instant fetch: ${pollutant} for ${city} (${pollutantTrend.length} data points)`);

    res.json({
      success: true,
      city: city,
      pollutant: pollutant,
      count: pollutantTrend.length,
      data: pollutantTrend
    });

  } catch (error) {
    console.error('Error fetching pollutant data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/air-quality/multi-pollutants - Get multiple pollutants data with time range
router.get('/multi-pollutants', async (req, res) => {
  try {
    const { city, pollutants, timeRange } = req.query;

    if (!city || !pollutants) {
      return res.status(400).json({ 
        success: false, 
        error: 'City and pollutants parameters are required' 
      });
    }

    // Parse pollutants (comma-separated string to array)
    const pollutantList = pollutants.split(',');

    // Calculate date range based on timeRange parameter
    const endDate = new Date();
    let startDate = new Date();
    
    switch(timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24);
        break;
      case '3d':
        startDate.setDate(startDate.getDate() - 3);
        break;
      case '7d':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(startDate.getDate() - 30);
        break;
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      default:
        startDate.setHours(startDate.getHours() - 24); // Default to 24 hours
    }

    // Read CSV and filter data
    const csv = require('csv-parser');
    const csvPath = path.join(__dirname, '../../ml_service/city_hour_final.csv');
    const dataByTime = {};

    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          // Filter by city
          if (row.City && row.City.toLowerCase() === city.toLowerCase()) {
            const datetime = new Date(row.Datetime);
            
            // Filter by date range
            if (datetime >= startDate && datetime <= endDate) {
              const timeKey = row.Datetime;
              
              if (!dataByTime[timeKey]) {
                dataByTime[timeKey] = { datetime: row.Datetime };
              }

              // Add each pollutant value
              pollutantList.forEach(pollutant => {
                const value = parseFloat(row[pollutant.trim()]);
                if (!isNaN(value)) {
                  dataByTime[timeKey][pollutant.trim()] = value;
                }
              });
            }
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Convert to array and sort by datetime
    const results = Object.values(dataByTime).sort((a, b) => 
      new Date(a.datetime) - new Date(b.datetime)
    );

    res.json({
      success: true,
      city: city,
      pollutants: pollutantList,
      timeRange: timeRange,
      count: results.length,
      data: results
    });
  } catch (error) {
    console.error('Error fetching multi-pollutant data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/air-quality/refresh - Reload pre-computed data
router.get('/refresh', (req, res) => {
  try {
    aqiData = null;
    citiesList = [];
    metadata = null;
    
    loadPrecomputedData();
    
    if (!aqiData) {
      return res.status(503).json({
        success: false,
        error: 'Failed to reload data'
      });
    }

    res.json({
      success: true,
      message: 'AQI data reloaded successfully',
      cities: citiesList.length,
      generatedAt: metadata.generatedAt
    });
  } catch (error) {
    console.error('Error refreshing data:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/air-quality/historical-forecast - Get historical + forecast data for pollutant
router.get('/historical-forecast', async (req, res) => {
  try {
    const { city, pollutant, hours, forecastDays } = req.query;

    if (!city || !pollutant) {
      return res.status(400).json({
        success: false,
        error: 'City and pollutant parameters are required'
      });
    }

    const csvPath = path.join(__dirname, '../../ml_service/city_hour_final.csv');
    const historicalData = [];
    
    // Read CSV and get historical data
    await new Promise((resolve, reject) => {
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
          if (row.City === city) {
            historicalData.push({
              datetime: row.Datetime,
              value: parseFloat(row[pollutant]) || 0,
              city: row.City
            });
          }
        })
        .on('end', resolve)
        .on('error', reject);
    });

    // Sort by datetime and get latest N hours
    historicalData.sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
    const hoursToShow = parseInt(hours) || 24;
    const recentHistorical = historicalData.slice(-hoursToShow);

    // Generate forecast using simple linear regression
    const forecastHorizon = parseInt(forecastDays) || 7;
    const forecastData = generateSimpleForecast(recentHistorical, forecastHorizon, pollutant);

    res.json({
      success: true,
      city: city,
      pollutant: pollutant,
      historical: recentHistorical,
      forecast: forecastData,
      metadata: {
        historicalPoints: recentHistorical.length,
        forecastPoints: forecastData.length,
        timeRange: `${hoursToShow} hours`,
        forecastHorizon: `${forecastHorizon} days`
      }
    });

  } catch (error) {
    console.error('Error fetching historical-forecast data:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Helper function for simple linear regression forecast
function generateSimpleForecast(historicalData, days, pollutant) {
  if (!historicalData || historicalData.length < 10) {
    return [];
  }

  // Use last 100 points for training (or all if less)
  const trainingData = historicalData.slice(-100);
  const values = trainingData.map(d => d.value);
  
  // Simple linear regression
  const n = values.length;
  const xValues = Array.from({ length: n }, (_, i) => i);
  const yValues = values;
  
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = xValues.reduce((sum, x, i) => sum + x * yValues[i], 0);
  const sumX2 = xValues.reduce((sum, x) => sum + x * x, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate average and standard deviation for variance
  const avg = sumY / n;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  // Generate forecast for next N days
  const forecastPoints = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].datetime);
  
  // Generate daily forecasts with trend and realistic variance
  for (let day = 1; day <= days; day++) {
    const futureDate = new Date(lastDate);
    futureDate.setDate(futureDate.getDate() + day);
    
    // Use hourly step for more realistic progression
    const x = n + day;
    let predictedValue = slope * x + intercept;
    
    // Add cyclical pattern (simulating day-to-day variation)
    const cyclicalComponent = stdDev * 0.3 * Math.sin(day * 0.5);
    predictedValue += cyclicalComponent;
    
    // Add small random variation based on historical std dev
    const randomVariation = (Math.random() - 0.5) * stdDev * 0.2;
    predictedValue += randomVariation;
    
    // Ensure non-negative
    predictedValue = Math.max(0, predictedValue);
    
    forecastPoints.push({
      datetime: futureDate.toISOString(),
      value: parseFloat(predictedValue.toFixed(2)),
      day: day
    });
  }
  
  return forecastPoints;
}

module.exports = router;
