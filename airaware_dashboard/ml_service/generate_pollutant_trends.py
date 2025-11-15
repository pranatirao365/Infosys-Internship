"""
Generate Pollutant Trends Forecast
Trains on latest 100 data points and predicts 7-day trends for each pollutant
Similar to precomputed-forecasts.json approach
"""

import pandas as pd
import numpy as np
import json
from datetime import datetime, timedelta
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import warnings
warnings.filterwarnings('ignore')

# File paths
CSV_PATH = 'city_hour_final.csv'
OUTPUT_FILE = 'precomputed-pollutant-trends.json'

# Pollutants to forecast - all pollutants present in CSV
POLLUTANTS = ['PM2.5', 'NO', 'NO2', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene']

# Days of week
DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

print('🚀 Starting Pollutant Trends Forecast Generation...\n')
print(f'📂 Reading CSV: {CSV_PATH}')

# Read the CSV
df = pd.read_csv(CSV_PATH)
print(f'✅ Loaded {len(df):,} records')

# Convert datetime
df['Datetime'] = pd.to_datetime(df['Datetime'])
df = df.sort_values('Datetime')

# Get unique cities
cities = df['City'].unique()
print(f'📍 Found {len(cities)} cities\n')

# Store all forecasts
all_forecasts = {}

def simple_forecast_model(data_points, periods=7):
    """
    Train simple model on data points and forecast next periods
    Using Linear Regression for simplicity and speed
    """
    if len(data_points) < 10:
        # Not enough data, return simple average
        avg_value = np.mean(data_points)
        return [avg_value] * periods
    
    # Prepare data
    X = np.arange(len(data_points)).reshape(-1, 1)
    y = np.array(data_points)
    
    # Remove NaN values
    mask = ~np.isnan(y)
    X = X[mask]
    y = y[mask]
    
    if len(y) < 5:
        avg_value = np.mean(y)
        return [avg_value] * periods
    
    # Train model
    model = LinearRegression()
    model.fit(X, y)
    
    # Predict next periods
    future_X = np.arange(len(data_points), len(data_points) + periods).reshape(-1, 1)
    predictions = model.predict(future_X)
    
    # Ensure non-negative values
    predictions = np.maximum(predictions, 0)
    
    return predictions.tolist()

# Process each city
for city_idx, city in enumerate(cities, 1):
    print(f'[{city_idx}/{len(cities)}] Processing {city}...')
    
    # Get city data
    city_data = df[df['City'] == city].copy()
    
    # Sort by datetime and get latest 100 records
    city_data = city_data.sort_values('Datetime', ascending=False).head(100)
    city_data = city_data.sort_values('Datetime')  # Sort ascending for training
    
    if len(city_data) < 20:
        print(f'  ⚠️ Skipping {city} - insufficient data ({len(city_data)} records)')
        continue
    
    # Train and forecast for each pollutant
    city_forecasts = {}
    
    for pollutant in POLLUTANTS:
        # Get pollutant values from latest 100 records
        if pollutant in city_data.columns:
            values = city_data[pollutant].values
            
            # Replace NaN with column mean
            values = pd.Series(values).fillna(pd.Series(values).mean()).values
            
            # Generate 7-day forecast
            forecasts = simple_forecast_model(values, periods=7)
            
            # Store forecast with day labels
            city_forecasts[pollutant] = forecasts
            
            print(f'  ✓ {pollutant}: Trained on {len(values)} points → 7-day forecast generated')
    
    # Create weekly forecast structure
    weekly_forecast = []
    for day_idx, day in enumerate(DAYS):
        day_data = {
            'day': day,
            'dayIndex': day_idx
        }
        
        # Add each pollutant's forecast for this day
        for pollutant in POLLUTANTS:
            if pollutant in city_forecasts:
                day_data[pollutant] = round(city_forecasts[pollutant][day_idx], 2)
        
        weekly_forecast.append(day_data)
    
    # Store in final structure
    all_forecasts[city] = {
        'city': city,
        'trainedOn': 100,
        'forecastDays': 7,
        'pollutants': POLLUTANTS,
        'trends': weekly_forecast,
        'metadata': {
            'lastDataPoint': city_data['Datetime'].max().strftime('%Y-%m-%d %H:%M:%S'),
            'generatedAt': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
    }
    
    print(f'  ✅ {city} forecast complete\n')

# Add global metadata
final_output = {
    'metadata': {
        'generatedAt': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'totalCities': len(all_forecasts),
        'pollutants': POLLUTANTS,
        'forecastDays': 7,
        'trainingDataPoints': 100,
        'model': 'Linear Regression',
        'description': 'Weekly pollutant concentration trends forecast'
    },
    'forecasts': all_forecasts
}

# Save to JSON
print('💾 Saving forecasts to JSON...')
with open(OUTPUT_FILE, 'w') as f:
    json.dump(final_output, f, indent=2)

print(f'\n✅ SUCCESS! Generated forecasts for {len(all_forecasts)} cities')
print(f'📄 Saved to: {OUTPUT_FILE}')
print(f'📊 File size: {len(json.dumps(final_output)) / 1024:.2f} KB')

# Print sample output
if len(all_forecasts) > 0:
    sample_city = list(all_forecasts.keys())[0]
    print(f'\n📋 Sample forecast for {sample_city}:')
    for trend in all_forecasts[sample_city]['trends'][:3]:
        print(f'  {trend["day"]}: PM2.5={trend.get("PM2.5", 0):.2f}, NO2={trend.get("NO2", 0):.2f}, O3={trend.get("O3", 0):.2f}')

print('\n🎉 Pollutant trends forecast generation complete!')
