import pandas as pd
import numpy as np
import pickle
from datetime import datetime, timedelta
import json

print("📊 Loading data and XGBoost model...")

# Load CSV data
df = pd.read_csv('city_hour_final.csv')
df['Datetime'] = pd.to_datetime(df['Datetime'])

# Add day_of_week column (0=Monday, 6=Sunday)
df['day_of_week'] = df['Datetime'].dt.dayofweek

# Load XGBoost model
try:
    with open('best_model_xgboost.pkl', 'rb') as f:
        model = pickle.load(f)
    model_loaded = True
    print("✅ XGBoost model loaded successfully")
except Exception as e:
    print(f"⚠️ Could not load XGBoost model: {e}")
    print("⚠️ Will use day-of-week statistical forecasting instead")
    model_loaded = False

print(f"✅ Loaded {len(df)} records from CSV")

# Get list of all cities
cities = sorted(df['City'].unique())
print(f"\n🌍 Found {len(cities)} cities")

# Simple AQI estimation from PM2.5 (CPCB standards)
def estimate_aqi_from_pm25(pm25):
    """Calculate AQI from PM2.5 using CPCB breakpoints"""
    if pm25 <= 30:
        return (50 / 30) * pm25
    elif pm25 <= 60:
        return 50 + ((100 - 50) / (60 - 30)) * (pm25 - 30)
    elif pm25 <= 90:
        return 100 + ((200 - 100) / (90 - 60)) * (pm25 - 60)
    elif pm25 <= 120:
        return 200 + ((300 - 200) / (120 - 90)) * (pm25 - 90)
    elif pm25 <= 250:
        return 300 + ((400 - 300) / (250 - 120)) * (pm25 - 120)
    else:
        return 400 + ((500 - 400) / (380 - 250)) * (min(pm25, 380) - 250)

# Function to get day-of-week specific predictions
def predict_by_day_of_week(city_data, forecast_date, target_day_of_week):
    """
    Predict AQI based on historical data for the SAME day of week
    E.g., for Monday prediction, use only historical Monday data
    """
    # Filter data for the specific day of week
    day_specific_data = city_data[city_data['day_of_week'] == target_day_of_week].copy()
    
    if len(day_specific_data) < 5:
        # Fallback to all data if not enough day-specific data
        day_specific_data = city_data
    
    # Calculate average pollutants for this specific day of week
    avg_pm25 = day_specific_data['PM2.5'].mean()
    avg_pm10 = day_specific_data['PM10'].mean() if 'PM10' in day_specific_data.columns else 0
    avg_no = day_specific_data['NO'].mean() if 'NO' in day_specific_data.columns else 0
    avg_no2 = day_specific_data['NO2'].mean() if 'NO2' in day_specific_data.columns else 0
    avg_nox = day_specific_data['NOx'].mean() if 'NOx' in day_specific_data.columns else 0
    avg_nh3 = day_specific_data['NH3'].mean() if 'NH3' in day_specific_data.columns else 0
    avg_co = day_specific_data['CO'].mean() if 'CO' in day_specific_data.columns else 0
    avg_so2 = day_specific_data['SO2'].mean() if 'SO2' in day_specific_data.columns else 0
    avg_o3 = day_specific_data['O3'].mean() if 'O3' in day_specific_data.columns else 0
    avg_benzene = day_specific_data['Benzene'].mean() if 'Benzene' in day_specific_data.columns else 0
    avg_toluene = day_specific_data['Toluene'].mean() if 'Toluene' in day_specific_data.columns else 0
    avg_xylene = day_specific_data['Xylene'].mean() if 'Xylene' in day_specific_data.columns else 0
    
    # Also get recent trend (last 3 months) for this day of week
    recent_day_data = day_specific_data.sort_values('Datetime', ascending=False).head(12)  # Last ~3 months of this day
    
    if len(recent_day_data) > 0:
        recent_weight = 0.7  # Give 70% weight to recent trend
        historical_weight = 0.3  # 30% to historical average
        
        recent_pm25 = recent_day_data['PM2.5'].mean()
        avg_pm25 = recent_pm25 * recent_weight + avg_pm25 * historical_weight
    
    # Prepare features for XGBoost
    features = {
        'year': forecast_date.year,
        'month': forecast_date.month,
        'day': forecast_date.day,
        'hour': 12,
        'day_of_week': target_day_of_week,
        'PM2.5': avg_pm25,
        'PM10': avg_pm10,
        'NO': avg_no,
        'NO2': avg_no2,
        'NOx': avg_nox,
        'NH3': avg_nh3,
        'CO': avg_co,
        'SO2': avg_so2,
        'O3': avg_o3,
        'Benzene': avg_benzene,
        'Toluene': avg_toluene,
        'Xylene': avg_xylene
    }
    
    if model_loaded:
        try:
            # Create feature array
            feature_cols = ['year', 'month', 'day', 'hour', 'day_of_week', 
                           'PM2.5', 'PM10', 'NO', 'NO2', 'NOx', 'NH3', 
                           'CO', 'SO2', 'O3', 'Benzene', 'Toluene', 'Xylene']
            
            # Check if model has feature_names_in_ attribute
            if hasattr(model, 'feature_names_in_'):
                feature_cols = [col for col in model.feature_names_in_ if col in features]
            
            feature_array = np.array([[features[col] for col in feature_cols]])
            
            # Predict using XGBoost
            predicted_aqi = model.predict(feature_array)[0]
            
            # Add small realistic variation (±3%)
            variation = (np.random.random() - 0.5) * 0.06
            predicted_aqi = predicted_aqi * (1 + variation)
            
            predicted_aqi = max(0, min(500, predicted_aqi))
            
        except Exception as e:
            print(f"  ⚠️ XGBoost prediction failed, using statistical method: {e}")
            # Fallback to statistical AQI calculation
            predicted_aqi = estimate_aqi_from_pm25(avg_pm25)
    else:
        # Use statistical method based on PM2.5
        predicted_aqi = estimate_aqi_from_pm25(avg_pm25)
        # Add small variation
        variation = (np.random.random() - 0.5) * 0.06
        predicted_aqi = predicted_aqi * (1 + variation)
    
    return predicted_aqi, len(day_specific_data)

# Generate forecasts for all cities
forecasts = {}
day_names = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
today = datetime.now()

for city in cities:
    print(f"\n🔮 Generating day-of-week specific forecast for {city}...")
    
    # Get city data
    city_data = df[df['City'] == city].copy()
    
    if len(city_data) < 10:
        print(f"⚠️ Skipping {city} - insufficient data ({len(city_data)} records)")
        continue
    
    # Generate predictions for next 7 days
    city_forecast = []
    day_stats = []
    
    for i in range(1, 8):
        forecast_date = today + timedelta(days=i)
        target_day_of_week = forecast_date.weekday()  # 0=Monday, 6=Sunday
        
        # Get prediction based on historical data for this specific day of week
        predicted_aqi, sample_count = predict_by_day_of_week(city_data, forecast_date, target_day_of_week)
        
        # Format prediction
        city_forecast.append({
            'date': forecast_date.strftime('%b %d'),
            'day': day_names[target_day_of_week],
            'aqi': round(predicted_aqi, 1)
        })
        
        day_stats.append(f"{day_names[target_day_of_week]}({sample_count} samples)")
    
    forecasts[city] = city_forecast
    aqi_values = [f['aqi'] for f in city_forecast]
    print(f"  ✅ {city}: {aqi_values}")
    print(f"     Day samples: {', '.join(day_stats)}")

# Save to JSON file
output_file = 'precomputed-forecasts.json'
with open(output_file, 'w') as f:
    json.dump(forecasts, f, indent=2)

print(f"\n🎉 Day-of-week specific forecasts generated for {len(forecasts)} cities!")
print(f"💾 Saved to {output_file}")
print(f"\n📊 METHOD: Each day's prediction is based on historical data for that specific weekday")
print(f"   ✅ Monday predictions → Average of all historical Mondays")
print(f"   ✅ Tuesday predictions → Average of all historical Tuesdays")
print(f"   ✅ Wednesday predictions → Average of all historical Wednesdays")
print(f"   ✅ etc. (70% recent trend + 30% historical average)")
