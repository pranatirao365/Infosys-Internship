"""
Milestone 2 - Train ARIMA, Prophet, and XGBoost Models for Each Pollutant
Generates pollutant-based forecast results for the dashboard
"""

import pandas as pd
import numpy as np
from statsmodels.tsa.arima.model import ARIMA
from prophet import Prophet
from sklearn.metrics import mean_squared_error, mean_absolute_error
from sklearn.preprocessing import MinMaxScaler
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

# Set random seeds for reproducibility
np.random.seed(42)

print("=" * 80)
print("MILESTONE 2: POLLUTANT-BASED FORECASTING (ARIMA + Prophet + XGBoost)")
print("=" * 80)

# Load cleaned data
print("\n📂 Loading cleaned dataset...")
df = pd.read_csv('city_hour_final.csv')
df['Datetime'] = pd.to_datetime(df['Datetime'])
print(f"✅ Loaded {len(df):,} records")

# Define pollutants to forecast (excluding AQI and non-pollutant columns)
pollutants = ['PM2.5', 'NO', 'NO2', 'NOx', 'NH3', 'CO', 'SO2', 'O3', 'Benzene', 'Toluene']
# Filter to only pollutants that exist in the dataset
pollutants = [p for p in pollutants if p in df.columns]

print(f"\n🎯 Target Pollutants: {', '.join(pollutants)}")

# Initialize results storage
arima_results = []
prophet_results = []
xgboost_results = []
model_comparison_results = []

print("\n" + "=" * 80)
print("TRAINING MODELS FOR EACH POLLUTANT")
print("=" * 80)

# Helper function to create lag features for XGBoost
def create_lag_features(data, n_lags=30):
    """Create lagged features for supervised learning"""
    # Convert to pandas Series if numpy array
    if isinstance(data, np.ndarray):
        data = pd.Series(data)
    
    df = pd.DataFrame()
    df['target'] = data.values
    for i in range(1, n_lags + 1):
        df[f'lag_{i}'] = data.shift(i).values
    df = df.dropna()
    return df

# Train models for each pollutant
for pollutant in pollutants:
    print(f"\n{'='*80}")
    print(f"📊 POLLUTANT: {pollutant}")
    print(f"{'='*80}")
    
    # Aggregate data: Average pollutant value per day across all cities
    daily_data = df.groupby('Datetime')[pollutant].mean().reset_index()
    daily_data = daily_data.dropna()
    
    if len(daily_data) < 100:
        print(f"⚠️  Skipping {pollutant} - insufficient data ({len(daily_data)} points)")
        continue
    
    print(f"📈 Data points: {len(daily_data):,}")
    
    # Split into train/test (80/20)
    split_idx = int(len(daily_data) * 0.8)
    train = daily_data[:split_idx]
    test = daily_data[split_idx:]
    
    print(f"   Train: {len(train):,} points | Test: {len(test):,} points")
    
    # =========================================================================
    # ARIMA MODEL
    # =========================================================================
    print("\n🔵 Training ARIMA...")
    try:
        # Auto-select best order (p,d,q) using AIC
        arima_model = ARIMA(train[pollutant], order=(5,1,2))  # Common starting point
        arima_fit = arima_model.fit()
        
        # Forecast
        arima_forecast = arima_fit.forecast(steps=len(test))
        
        # Calculate metrics
        arima_rmse = np.sqrt(mean_squared_error(test[pollutant], arima_forecast))
        arima_mae = mean_absolute_error(test[pollutant], arima_forecast)
        
        print(f"   ✅ ARIMA RMSE: {arima_rmse:.4f}")
        print(f"   ✅ ARIMA MAE:  {arima_mae:.4f}")
        
        # Store results
        arima_results.append({
            'Pollutant': pollutant,
            'RMSE': round(arima_rmse, 4),
            'MAE': round(arima_mae, 4),
            'DataPoints': len(daily_data)
        })
        
        model_comparison_results.append({
            'Pollutant': pollutant,
            'Model': 'ARIMA',
            'RMSE': round(arima_rmse, 4),
            'MAE': round(arima_mae, 4),
            'DataPoints': len(daily_data)
        })
        
    except Exception as e:
        print(f"   ❌ ARIMA failed: {str(e)[:100]}")
        arima_rmse = None
    
    # =========================================================================
    # PROPHET MODEL
    # =========================================================================
    print("\n🟣 Training Prophet...")
    try:
        # Prepare data for Prophet (requires 'ds' and 'y' columns)
        prophet_train = train.rename(columns={'Datetime': 'ds', pollutant: 'y'})
        prophet_test = test.rename(columns={'Datetime': 'ds', pollutant: 'y'})
        
        # Initialize and train Prophet
        model = Prophet(
            daily_seasonality=True,
            weekly_seasonality=True,
            yearly_seasonality=True,
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.05
        )
        
        model.fit(prophet_train)
        
        # Create future dataframe for forecasting
        future = model.make_future_dataframe(periods=len(test), freq='D')
        forecast = model.predict(future)
        
        # Get forecast for test period
        prophet_forecast = forecast.tail(len(test))['yhat'].values
        
        # Calculate metrics
        prophet_rmse = np.sqrt(mean_squared_error(test[pollutant], prophet_forecast))
        prophet_mae = mean_absolute_error(test[pollutant], prophet_forecast)
        
        print(f"   ✅ Prophet RMSE: {prophet_rmse:.4f}")
        print(f"   ✅ Prophet MAE:  {prophet_mae:.4f}")
        
        # Store results
        prophet_results.append({
            'Pollutant': pollutant,
            'RMSE': round(prophet_rmse, 4),
            'MAE': round(prophet_mae, 4),
            'DataPoints': len(daily_data)
        })
        
        model_comparison_results.append({
            'Pollutant': pollutant,
            'Model': 'Prophet',
            'RMSE': round(prophet_rmse, 4),
            'MAE': round(prophet_mae, 4),
            'DataPoints': len(daily_data)
        })
        
    except Exception as e:
        print(f"   ❌ Prophet failed: {str(e)[:100]}")
        prophet_rmse = None
    
    # =========================================================================
    # XGBOOST MODEL
    # =========================================================================
    print("\n🟢 Training XGBoost...")
    xgboost_rmse = None  # Initialize
    try:
        # Create lag features (use past 30 days as features)
        lag_df = create_lag_features(daily_data[pollutant].values, n_lags=30)
        
        if len(lag_df) < 50:
            print(f"   ⚠️  Insufficient data for XGBoost ({len(lag_df)} samples)")
            xgboost_rmse = None
        else:
            # Split features and target
            X = lag_df.drop('target', axis=1)
            y = lag_df['target']
            
            # Train/test split (80/20)
            train_size = int(len(X) * 0.8)
            X_train, X_test = X[:train_size], X[train_size:]
            y_train, y_test = y[:train_size], y[train_size:]
            
            # Build XGBoost model
            xgb_model = xgb.XGBRegressor(
                n_estimators=100,
                learning_rate=0.1,
                max_depth=6,
                random_state=42,
                verbosity=0  # Silent training
            )
            
            # Train model
            xgb_model.fit(X_train, y_train)
            
            # Predict
            xgboost_forecast = xgb_model.predict(X_test)
            
            # Calculate metrics
            xgboost_rmse = np.sqrt(mean_squared_error(y_test, xgboost_forecast))
            xgboost_mae = mean_absolute_error(y_test, xgboost_forecast)
            
            print(f"   ✅ XGBoost RMSE: {xgboost_rmse:.4f}")
            print(f"   ✅ XGBoost MAE:  {xgboost_mae:.4f}")
            
            # Store results
            xgboost_results.append({
                'Pollutant': pollutant,
                'RMSE': round(xgboost_rmse, 4),
                'MAE': round(xgboost_mae, 4),
                'DataPoints': len(daily_data)
            })
            
            model_comparison_results.append({
                'Pollutant': pollutant,
                'Model': 'XGBoost',
                'RMSE': round(xgboost_rmse, 4),
                'MAE': round(xgboost_mae, 4),
                'DataPoints': len(daily_data)
            })
        
    except Exception as e:
        print(f"   ❌ XGBoost failed: {str(e)[:100]}")
        xgboost_rmse = None
    
    # =========================================================================
    # COMPARISON
    # =========================================================================
    valid_models = []
    if arima_rmse: valid_models.append(('ARIMA', arima_rmse))
    if prophet_rmse: valid_models.append(('Prophet', prophet_rmse))
    if xgboost_rmse: valid_models.append(('XGBoost', xgboost_rmse))
    
    if valid_models:
        winner = min(valid_models, key=lambda x: x[1])
        print(f"\n🏆 Best Model for {pollutant}: {winner[0]} (RMSE: {winner[1]:.4f})")
        if len(valid_models) > 1:
            second_best = sorted(valid_models, key=lambda x: x[1])[1]
            print(f"   Improvement over {second_best[0]}: {abs(winner[1] - second_best[1]):.4f} RMSE")

# ============================================================================
# SAVE RESULTS
# ============================================================================
print("\n" + "=" * 80)
print("💾 SAVING RESULTS")
print("=" * 80)

# Save ARIMA results
arima_df = pd.DataFrame(arima_results)
arima_df.to_csv('arima_pollutant_results.csv', index=False)
print(f"\n✅ Saved: arima_pollutant_results.csv ({len(arima_df)} pollutants)")

# Save Prophet results
prophet_df = pd.DataFrame(prophet_results)
prophet_df.to_csv('prophet_pollutant_results.csv', index=False)
print(f"✅ Saved: prophet_pollutant_results.csv ({len(prophet_df)} pollutants)")

# Save XGBoost results
xgboost_df = pd.DataFrame(xgboost_results)
xgboost_df.to_csv('xgboost_pollutant_results.csv', index=False)
print(f"✅ Saved: xgboost_pollutant_results.csv ({len(xgboost_df)} pollutants)")

# Save combined comparison
comparison_df = pd.DataFrame(model_comparison_results)
comparison_df.to_csv('model_comparison_pollutant_results.csv', index=False)
print(f"✅ Saved: model_comparison_pollutant_results.csv ({len(comparison_df)} rows)")

# ============================================================================
# SUMMARY STATISTICS
# ============================================================================
print("\n" + "=" * 80)
print("📊 SUMMARY STATISTICS")
print("=" * 80)

print("\n🔵 ARIMA Performance:")
print(arima_df.to_string(index=False))
print(f"\n   Average RMSE: {arima_df['RMSE'].mean():.4f}")
print(f"   Best Pollutant: {arima_df.loc[arima_df['RMSE'].idxmin(), 'Pollutant']} (RMSE: {arima_df['RMSE'].min():.4f})")
print(f"   Worst Pollutant: {arima_df.loc[arima_df['RMSE'].idxmax(), 'Pollutant']} (RMSE: {arima_df['RMSE'].max():.4f})")

print("\n\n🟣 Prophet Performance:")
print(prophet_df.to_string(index=False))
print(f"\n   Average RMSE: {prophet_df['RMSE'].mean():.4f}")
print(f"   Best Pollutant: {prophet_df.loc[prophet_df['RMSE'].idxmin(), 'Pollutant']} (RMSE: {prophet_df['RMSE'].min():.4f})")
print(f"   Worst Pollutant: {prophet_df.loc[prophet_df['RMSE'].idxmax(), 'Pollutant']} (RMSE: {prophet_df['RMSE'].max():.4f})")

print("\n\n🟢 XGBoost Performance:")
print(xgboost_df.to_string(index=False))
print(f"\n   Average RMSE: {xgboost_df['RMSE'].mean():.4f}")
print(f"   Best Pollutant: {xgboost_df.loc[xgboost_df['RMSE'].idxmin(), 'Pollutant']} (RMSE: {xgboost_df['RMSE'].min():.4f})")
print(f"   Worst Pollutant: {xgboost_df.loc[xgboost_df['RMSE'].idxmax(), 'Pollutant']} (RMSE: {xgboost_df['RMSE'].max():.4f})")

print("\n\n🏆 Best Model per Pollutant:")
best_models = comparison_df.loc[comparison_df.groupby('Pollutant')['RMSE'].idxmin()]
print(best_models[['Pollutant', 'Model', 'RMSE']].to_string(index=False))

print("\n" + "=" * 80)
print("✅ MILESTONE 2 COMPLETE!")
print("=" * 80)
print("\n📂 Generated Files:")
print("   • arima_pollutant_results.csv")
print("   • prophet_pollutant_results.csv")
print("   • xgboost_pollutant_results.csv")
print("   • model_comparison_pollutant_results.csv")
print("\n🚀 Ready to integrate with dashboard!")
