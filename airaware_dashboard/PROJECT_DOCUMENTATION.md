# AirAware Dashboard - Complete Project Documentation

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [System Architecture](#system-architecture)
4. [Features](#features)
5. [Installation & Setup](#installation--setup)
6. [Project Structure](#project-structure)
7. [Data Flow](#data-flow)
8. [API Documentation](#api-documentation)
9. [Machine Learning Models](#machine-learning-models)
10. [Frontend Components](#frontend-components)
11. [Deployment Guide](#deployment-guide)
12. [Troubleshooting](#troubleshooting)

---

## 📌 Project Overview

**AirAware Dashboard** is a comprehensive air quality monitoring and forecasting system designed for 26 Indian cities. The project provides real-time air quality analysis, 7-day forecasts for 10 pollutants, and interactive data visualization.

### Key Objectives
- Monitor air quality across 26 Indian cities
- Forecast pollutant levels for 7 days using machine learning
- Provide interactive data exploration and visualization
- Generate real-time alerts based on AQI thresholds
- Enable admin controls for data management

### Target Users
- Environmental agencies
- Public health officials
- Researchers and data analysts
- General public concerned about air quality

---

## 🛠 Technology Stack

### Frontend
- **Framework**: React 19.2.0
- **Routing**: React Router 7.9.5
- **Charting**: Recharts 3.3.0
- **HTTP Client**: Axios 1.13.1
- **Styling**: Custom CSS with Glass-morphism effects
- **Port**: 3000

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 5.1.0
- **Database**: MongoDB 6.20.0
- **File Processing**: csv-parser 3.2.0, multer
- **Port**: 8000

### ML Service
- **Language**: Python 3.x
- **Libraries**: 
  - pandas, numpy (Data Processing)
  - scikit-learn (Linear Regression)
  - Prophet, ARIMA, XGBoost (Advanced Models)
- **Data**: 707,875 hourly records from city_hour_final.csv

### Data Storage
- **CSV Files**: Historical air quality data
- **JSON Files**: Precomputed forecasts and trends
- **MongoDB**: Real-time data storage (optional)

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface (React)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Interactive  │  │    Data      │  │   Forecast   │      │
│  │  Dashboard   │  │  Explorer    │  │    Engine    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP/REST API
┌─────────────────────────────────────────────────────────────┐
│              Backend Server (Express.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Air Quality  │  │   Forecast   │  │    Admin     │      │
│  │    Routes    │  │    Routes    │  │    Routes    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│                   Data Layer                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    CSV       │  │   JSON       │  │   MongoDB    │      │
│  │  (700K rows) │  │ (Precomputed)│  │  (Optional)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            ↕
┌─────────────────────────────────────────────────────────────┐
│           ML Service (Python)                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Training   │  │  Forecasting │  │   Evaluation │      │
│  │   Scripts    │  │   Generation │  │   Results    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### 1. Interactive Dashboard (Milestone 4)
**Layout**: 2x2 Grid Layout
- **Current AQI** (35% width)
  - Indian AQI scale (0-500)
  - Donut chart visualization
  - 6 category color coding
  - Real-time city selection

- **PM2.5 Forecast** (65% width)
  - Historical data + 7-day forecast
  - Intelligent data sampling
  - D+1 to D+7 day labels
  - Connected line charts

- **Pollutant Trends** (50% width)
  - 10 pollutants tracked
  - Multi-select checkboxes
  - 7-day trend visualization
  - Independent pollutant controls

- **Active Alerts** (50% width)
  - Real-time AQI warnings
  - Pollutant-specific alerts
  - Forecast trend notifications
  - Severity-based color coding

### 2. Data Explorer
- Historical data analysis
- Statistical summaries
- Pollutant correlations
- Distribution analysis
- Time series visualization
- Data quality metrics

### 3. Forecast Engine
- 7-day pollutant forecasts
- Multiple model support (Linear Regression, Prophet, ARIMA)
- Model comparison metrics
- City-specific predictions
- Confidence intervals

### 4. Admin Controls
- CSV dataset upload
- Model retraining triggers
- Data validation
- System health monitoring

---

## 🚀 Installation & Setup

### Prerequisites
```bash
Node.js >= 14.x
Python >= 3.8
npm >= 6.x
pip >= 20.x
```

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd airaware_dashboard
```

### Step 2: Backend Setup
```bash
cd backend
npm install
node server.js
# Server runs on http://localhost:8000
```

### Step 3: Frontend Setup
```bash
cd frontend
npm install
npm start
# App runs on http://localhost:3000
```

### Step 4: ML Service Setup
```bash
cd ml_service
pip install -r requirements.txt
python generate_pollutant_trends.py
# Generates precomputed forecasts
```

### Step 5: Environment Variables
Create `.env` file in backend folder:
```env
BACKEND_PORT=8000
MONGO_URI=your_mongodb_connection_string
DATABASE_NAME=airaware
COLLECTION_NAME=air_quality
```

---

## 📁 Project Structure

```
airaware_dashboard/
│
├── frontend/                      # React Application
│   ├── public/
│   │   ├── background.jpg         # Dashboard background
│   │   ├── index.html
│   │   └── manifest.json
│   ├── src/
│   │   ├── components/            # Reusable Components
│   │   │   ├── CurrentAQIDonut.js
│   │   │   ├── ForecastChart.js
│   │   │   ├── PollutantTrendsChart.js
│   │   │   ├── AlertPanel.js
│   │   │   ├── AdminControls.js
│   │   │   ├── DataControls.js
│   │   │   └── ...
│   │   ├── pages/                 # Main Pages
│   │   │   ├── InteractiveDashboard.js
│   │   │   ├── DataExplorer.js
│   │   │   └── ForecastEngine.js
│   │   ├── App.js                 # Root Component
│   │   └── index.js               # Entry Point
│   ├── package.json
│   └── README.md
│
├── backend/                       # Express.js Server
│   ├── routes/
│   │   ├── air-quality.js         # AQI & Historical Data
│   │   ├── forecast.js            # Forecast Endpoints
│   │   └── admin.js               # Admin Operations
│   ├── data/                      # Precomputed Data
│   │   ├── precomputed-aqi.json
│   │   ├── precomputed-dashboard-data.json
│   │   └── precomputed-pollutant-trends.json
│   ├── scripts/
│   │   └── precompute-all-data.js
│   ├── server.js                  # Main Server File
│   └── package.json
│
├── ml_service/                    # Python ML Scripts
│   ├── city_hour_final.csv        # Main Dataset (707K rows)
│   ├── generate_forecasts.py     # Forecast Generation
│   ├── generate_pollutant_trends.py
│   ├── train_pollutant_models.py
│   ├── model_service.py
│   ├── main.py
│   ├── check_cities.py
│   ├── precomputed-forecasts.json
│   ├── precomputed-pollutant-trends.json
│   ├── *_results.csv              # Model Evaluation Results
│   └── requirements.txt
│
├── MILESTONE4_SETUP.md
├── requirements.txt
└── PROJECT_DOCUMENTATION.md       # This file
```

---

## 🔄 Data Flow

### 1. Dashboard Load Flow
```
User opens Dashboard 
  → Frontend sends GET /api/air-quality/current
    → Backend loads precomputed-dashboard-data.json
      → Returns current AQI for selected city
        → Frontend displays in CurrentAQIDonut component
```

### 2. Forecast Generation Flow
```
User selects city + pollutant + time range
  → Frontend sends GET /api/air-quality/historical-forecast
    → Backend reads city_hour_final.csv
      → Filters data for selected city
        → Sorts by datetime (latest N hours)
          → Generates 7-day forecast using Linear Regression
            → Returns {historical: [...], forecast: [...]}
              → Frontend displays in ForecastChart
```

### 3. Pollutant Trends Flow
```
Page load
  → Frontend sends GET /api/forecast/pollutant-trends
    → Backend loads precomputed-pollutant-trends.json
      → Returns 7-day trends for all 10 pollutants
        → Frontend displays in PollutantTrendsChart
          → User toggles pollutants via checkboxes
```

### 4. Admin Upload Flow
```
User uploads CSV file
  → Frontend sends POST /api/admin/upload-dataset (multipart/form-data)
    → Backend validates file (CSV, required columns)
      → Saves to ml_service/uploaded_data_<timestamp>.csv
        → Reads and counts records
          → Returns {success, filename, recordCount}
            → Frontend displays confirmation
```

---

## 📡 API Documentation

### Base URL
```
http://localhost:8000/api
```

### Endpoints

#### 1. Get Current AQI
```http
GET /api/air-quality/current?location={cityName}
```
**Response:**
```json
{
  "success": true,
  "city": "Delhi",
  "aqi": 285,
  "category": "Very Poor",
  "pollutants": {
    "PM2.5": 150.5,
    "PM10": 200.3,
    "NO2": 45.2,
    ...
  },
  "timestamp": "2025-11-07T10:30:00Z"
}
```

#### 2. Get Historical + Forecast Data
```http
GET /api/air-quality/historical-forecast?city={city}&pollutant={pollutant}&hours={hours}&forecastDays={days}
```
**Parameters:**
- `city`: City name (e.g., "Delhi")
- `pollutant`: Pollutant name (e.g., "PM2.5")
- `hours`: Historical hours to show (24, 168, 720)
- `forecastDays`: Forecast days (1, 7, 14)

**Response:**
```json
{
  "success": true,
  "city": "Delhi",
  "pollutant": "PM2.5",
  "historical": [
    {"datetime": "2025-11-06T10:00:00", "value": 145.2},
    {"datetime": "2025-11-06T11:00:00", "value": 148.5},
    ...
  ],
  "forecast": [
    {"day": 1, "value": 152.3, "min": 140.1, "max": 164.5},
    {"day": 2, "value": 148.7, "min": 136.2, "max": 161.2},
    ...
  ]
}
```

#### 3. Get Pollutant Trends
```http
GET /api/forecast/pollutant-trends
```
**Response:**
```json
{
  "success": true,
  "pollutants": {
    "PM2.5": [
      {"day": "Day 1", "value": 145.2},
      {"day": "Day 2", "value": 142.8},
      ...
    ],
    "NO2": [...],
    ...
  }
}
```

#### 4. Upload Dataset
```http
POST /api/admin/upload-dataset
Content-Type: multipart/form-data
```
**Body:**
```
dataset: <file.csv>
```
**Response:**
```json
{
  "success": true,
  "message": "Dataset uploaded successfully",
  "filename": "uploaded_data_1762422869604.csv",
  "recordsProcessed": 150000,
  "size": "25.5 MB"
}
```

#### 5. Retrain Models
```http
POST /api/admin/retrain-models
Content-Type: application/json
```
**Body:**
```json
{
  "model": "pollutant_trends"
}
```

#### 6. Get Cities List
```http
GET /api/air-quality/cities
```
**Response:**
```json
{
  "success": true,
  "cities": ["Ahmedabad", "Aizawl", "Amaravati", ...],
  "count": 26
}
```

---

## 🤖 Machine Learning Models

### 1. Linear Regression (Primary Model)
**Purpose**: 7-day pollutant forecasting

**Algorithm**:
```python
# Train on latest 100 hourly records
train_data = historical_data[-100:]

# Features: Time index (0 to 99)
X = np.arange(len(train_data)).reshape(-1, 1)
y = [point['value'] for point in train_data]

# Train Linear Regression
model = LinearRegression()
model.fit(X, y)

# Predict next 7 days (168 hours)
future_X = np.arange(100, 268).reshape(-1, 1)
predictions = model.predict(future_X)

# Add cyclical patterns and variance
for i, pred in enumerate(predictions):
    hour_of_day = i % 24
    cyclical_factor = 1 + 0.2 * np.sin(2 * np.pi * hour_of_day / 24)
    noise = np.random.normal(0, pred * 0.05)
    predictions[i] = pred * cyclical_factor + noise
```

**Features**:
- Simple and fast
- Works well for short-term trends
- Adds realistic variance
- Incorporates hourly patterns

### 2. Prophet (Advanced Model)
**Purpose**: Seasonal trend forecasting

**Features**:
- Handles seasonality automatically
- Detects holidays and special events
- Provides confidence intervals
- Better for long-term forecasts

### 3. ARIMA (Advanced Model)
**Purpose**: Time series forecasting

**Features**:
- Auto-regressive with moving averages
- Handles non-stationary data
- Good for complex patterns
- Requires parameter tuning

### 4. XGBoost (Advanced Model)
**Purpose**: Feature-based forecasting

**Features**:
- Uses gradient boosting
- Handles multiple features
- High accuracy for complex patterns
- Requires feature engineering

### Model Comparison Results
Generated files:
- `arima_city_results.csv`
- `prophet_city_results.csv`
- `arima_pollutant_results.csv`
- `prophet_pollutant_results.csv`
- `xgboost_pollutant_results.csv`
- `model_comparison_results.csv`
- `model_comparison_pollutant_results.csv`

---

## 🎨 Frontend Components

### Core Components

#### 1. InteractiveDashboard.js
**Purpose**: Main Milestone 4 dashboard with 2x2 grid layout

**State Management**:
```javascript
const [selectedLocation, setSelectedLocation] = useState('Delhi');
const [selectedPollutant, setSelectedPollutant] = useState('PM2.5');
const [timeRange, setTimeRange] = useState('7d');
const [forecastHorizon, setForecastHorizon] = useState('7d');
const [loading, setLoading] = useState(false);
```

**Key Features**:
- Sidebar controls (280px fixed width)
- 4 dashboard cards in 2x2 grid
- Real-time alert generation
- Glass-morphism styling
- Background image with blend

#### 2. CurrentAQIDonut.js
**Purpose**: Display current AQI with donut chart

**Indian AQI Scale**:
```javascript
const aqiCategories = [
  { name: 'Good', range: '0-50', color: '#4caf50' },
  { name: 'Satisfactory', range: '51-100', color: '#8bc34a' },
  { name: 'Moderate', range: '101-200', color: '#ffeb3b' },
  { name: 'Poor', range: '201-300', color: '#ff9800' },
  { name: 'Very Poor', range: '301-400', color: '#f44336' },
  { name: 'Severe', range: '401-500', color: '#9c27b0' }
];
```

**Sizing**: 240px height, innerRadius: 70, outerRadius: 95

#### 3. ForecastChart.js
**Purpose**: Display historical + forecast line chart

**Data Processing**:
- Intelligent sampling (24/28/30 points based on time range)
- Connection point between historical and forecast
- Time formatting: HH:MM for historical, D+1-D+7 for forecast
- Dual-line chart (blue for historical, orange for forecast)

**Features**:
```javascript
const processChartData = (historical, forecast) => {
  // Sample historical data based on size
  // Add connection point
  // Format forecast as D+1, D+2, etc.
  // Return combined array
};
```

#### 4. PollutantTrendsChart.js
**Purpose**: Multi-pollutant trend visualization

**Pollutants Tracked** (10 total):
```javascript
const pollutants = [
  'PM2.5', 'PM10', 'NO', 'NO2', 'NOx',
  'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene'
];
```

**Features**:
- Independent checkbox selection
- Default: PM2.5, NO2, O3
- 10 unique colors
- Smooth line charts

#### 5. AlertPanel.js
**Purpose**: Real-time alert notifications

**Alert Types**:
1. **AQI Alerts**: Based on category thresholds
2. **Pollutant Alerts**: Specific pollutant limits exceeded
3. **Forecast Alerts**: Predicted increases in pollution

**Alert Generation Logic**:
```javascript
const generateAlerts = async () => {
  // Fetch current AQI
  if (aqi > 300) alerts.push({type: 'danger', message: 'Very Poor AQI'});
  
  // Check pollutant levels
  if (PM2.5 > 90) alerts.push({type: 'warning', message: 'PM2.5 exceeded'});
  
  // Forecast trends
  if (forecast_increase > 20%) alerts.push({type: 'info', message: 'Rising trend'});
};
```

#### 6. AdminControls.js
**Purpose**: Dataset upload and model retraining

**Features**:
- CSV file upload with validation
- Model retraining triggers
- Success/error notifications
- Backend integration

---

## 🎨 Styling & Design

### Color Palette
- **Primary Green**: #2e7d32 (Buttons, headers)
- **Secondary Green**: #4caf50 (Accents)
- **Background**: Sky blue to grass green gradient
- **Cards**: White with 95% opacity (glass-morphism)
- **Text**: #333 (Primary), #666 (Secondary)

### Glass-Morphism Effect
```css
.dashboard-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}
```

### Background Blend
```css
.interactive-dashboard::before {
  background-image: url('/background.jpg');
  opacity: 0.12;
  filter: blur(1.5px) brightness(1.1);
}

.interactive-dashboard::after {
  background: linear-gradient(
    135deg,
    rgba(135, 206, 250, 0.25) 0%,    /* Sky blue */
    rgba(255, 255, 255, 0.4) 50%,    /* White */
    rgba(144, 238, 144, 0.25) 100%   /* Grass green */
  );
}
```

### Responsive Grid
```css
/* Top row: 35% AQI, 65% Forecast */
.dashboard-grid:first-of-type {
  grid-template-columns: 35% 65%;
}

/* Bottom row: 50% 50% */
.dashboard-grid:last-of-type {
  grid-template-columns: 1fr 1fr;
}
```

---

## 🌍 Supported Cities (26)

1. Ahmedabad
2. Aizawl
3. Amaravati
4. Amritsar
5. Bengaluru
6. Bhopal
7. Brajrajnagar
8. Chandigarh
9. Chennai
10. Coimbatore
11. Delhi
12. Ernakulam
13. Gurugram
14. Guwahati
15. Hyderabad
16. Jaipur
17. Jorapokhar
18. Kochi
19. Kolkata
20. Lucknow
21. Mumbai
22. Patna
23. Shillong
24. Talcher
25. Thiruvananthapuram
26. Visakhapatnam

---

## 📊 Dataset Information

### CSV File: city_hour_final.csv
- **Total Records**: 707,875 rows
- **Time Period**: Historical hourly data
- **Cities**: 26 Indian cities
- **Pollutants**: 10 tracked

### Columns
```
City, Datetime, PM2.5, PM10, NO, NO2, NOx, NH3, CO, SO2, O3, Benzene, Toluene, Xylene, AQI, AQI_Bucket
```

### Data Quality
- Missing values handled
- Outliers detected and flagged
- Timestamp validated
- City names standardized

---

## 🚢 Deployment Guide

### Option 1: Local Deployment
```bash
# Terminal 1: Backend
cd backend
node server.js

# Terminal 2: Frontend
cd frontend
npm start
```

### Option 2: Production Build
```bash
# Build frontend
cd frontend
npm run build

# Serve static files from backend
cd ../backend
# Update server.js to serve build folder
app.use(express.static(path.join(__dirname, '../frontend/build')));
```

### Option 3: Docker Deployment
```dockerfile
# Create Dockerfile
FROM node:18
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 8000 3000
CMD ["npm", "start"]
```

### Environment Setup
```bash
# Production .env
NODE_ENV=production
BACKEND_PORT=8000
FRONTEND_URL=https://your-domain.com
MONGO_URI=mongodb+srv://...
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Frontend Not Loading
**Issue**: Blank page or compilation errors
**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm start
```

#### 2. Backend Connection Failed
**Issue**: `ERR_CONNECTION_REFUSED`
**Solution**:
- Check if backend is running on port 8000
- Verify CORS settings in server.js
- Check firewall settings

#### 3. CSV Reading Slow
**Issue**: Forecast chart takes long to load
**Solution**:
- File is 700K rows, reading is slow
- Use precomputed data instead
- Implement caching mechanism
- Limit CSV reads with early termination

#### 4. Background Image Not Showing
**Issue**: Image path not resolved
**Solution**:
```bash
# Ensure image is in public folder
ls frontend/public/background.jpg

# Use relative path in CSS
background-image: url(../../public/background.jpg);
```

#### 5. Alerts Not Showing
**Issue**: Alert panel empty
**Solution**:
- Check browser console for API errors
- Verify `/api/air-quality/current` endpoint
- Ensure city name matches dataset

#### 6. MongoDB Connection Failed
**Issue**: `MongoServerError: connection refused`
**Solution**:
- Verify MONGO_URI in .env
- Check MongoDB Atlas whitelist IP
- Use `NODE_TLS_REJECT_UNAUTHORIZED='0'` for SSL issues

---

## 📈 Performance Metrics

### Current Performance
- **Dashboard Load Time**: ~2-3 seconds (includes CSV reading)
- **Forecast Generation**: ~1-2 seconds
- **API Response Time**: 100-500ms (precomputed data)
- **CSV Read Time**: 5-10 seconds (700K rows)

### Optimization Opportunities
1. **Implement Redis caching** for frequently accessed data
2. **Use database** instead of CSV for historical data
3. **Precompute all forecasts** periodically (cron job)
4. **Lazy load charts** to speed up initial render
5. **Implement pagination** for large datasets

---

## 🔐 Security Considerations

### Current Implementation
- No authentication/authorization
- Public API endpoints
- Development SSL bypass

### Production Recommendations
1. **Add JWT authentication** for admin routes
2. **Implement rate limiting** to prevent abuse
3. **Validate all user inputs** (SQL injection, XSS)
4. **Enable HTTPS** with proper SSL certificates
5. **Restrict CORS** to specific origins
6. **Hash sensitive data** in MongoDB
7. **Implement API key system** for external access

---

## 📝 Future Enhancements

### Planned Features
1. **User Authentication**: Login/signup system
2. **Personalized Alerts**: Email/SMS notifications
3. **Mobile App**: React Native version
4. **Offline Mode**: PWA with service workers
5. **Historical Comparisons**: Year-over-year trends
6. **Health Recommendations**: Based on AQI levels
7. **Data Export**: CSV/PDF reports
8. **Multi-language Support**: Hindi, Tamil, etc.
9. **Real-time Updates**: WebSocket integration
10. **Advanced ML Models**: Deep Learning (LSTM, GRU)

### Scalability Plans
- Microservices architecture
- Load balancing with Nginx
- Horizontal scaling with Kubernetes
- CDN for static assets
- Database sharding for large datasets

---

## 👥 Team & Credits

### Development Team
- **Frontend Development**: React Dashboard Implementation
- **Backend Development**: Express.js API Development
- **ML Engineering**: Python Forecasting Models
- **Data Processing**: CSV Handling & Analysis
- **UI/UX Design**: Glass-morphism Dashboard

### Data Sources
- Historical air quality data from government agencies
- City information from census data
- AQI standards from Central Pollution Control Board (CPCB)

---

## 📄 License

This project is developed as part of Infosys Internship program.

---

## 📞 Support & Contact

For issues, questions, or contributions:
- **GitHub Issues**: Create an issue in the repository
- **Email**: [Your Email]
- **Documentation**: See README.md files in each folder

---

## 🎯 Quick Start Commands

```bash
# Full Setup (Run in order)
cd backend && npm install && node server.js &
cd ../frontend && npm install && npm start &
cd ../ml_service && pip install -r requirements.txt && python generate_pollutant_trends.py

# Individual Services
npm start                          # Frontend (port 3000)
node backend/server.js             # Backend (port 8000)
python ml_service/main.py          # ML Service

# Data Generation
node backend/scripts/precompute-all-data.js    # Precompute dashboard data
python ml_service/generate_pollutant_trends.py  # Generate forecasts

# Testing
npm test                           # Run tests (if configured)
python ml_service/check_cities.py  # Verify dataset cities
```

---

**Document Version**: 1.0
**Last Updated**: November 7, 2025
**Project Status**: ✅ Complete (Milestone 4)

---

*End of Documentation*
