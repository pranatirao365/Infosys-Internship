import joblib
import pandas as pd
import numpy as np
from typing import Dict, List, Optional
import os
from datetime import datetime

class MLModelService:
    def __init__(self, model_path: str = None):
        """Initialize ML Model Service"""
        self.model = None
        # Use correct path to the model file in ml_service directory
        if model_path is None:
            current_dir = os.path.dirname(os.path.abspath(__file__))
            self.model_path = os.path.join(current_dir, "best_model_xgboost.pkl")
        else:
            self.model_path = model_path
        self.load_model()
    
    def load_model(self):
        """Load the trained XGBoost model"""
        try:
            if os.path.exists(self.model_path):
                self.model = joblib.load(self.model_path)
                print(f"Model loaded successfully from {self.model_path}")
            else:
                print(f"Model file not found at {self.model_path}")
                self.model = None
        except Exception as e:
            print(f"Error loading model: {e}")
            self.model = None
    
    def preprocess_data(self, df: pd.DataFrame) -> pd.DataFrame:
        """Preprocess data for model prediction"""
        try:
            # Basic preprocessing - adjust based on your model requirements
            processed_df = df.copy()
            
            # Handle missing values
            processed_df = processed_df.fillna(processed_df.mean(numeric_only=True))
            
            # Feature engineering (add your specific features here)
            if 'date' in processed_df.columns:
                processed_df['date'] = pd.to_datetime(processed_df['date'])
                processed_df['year'] = processed_df['date'].dt.year
                processed_df['month'] = processed_df['date'].dt.month
                processed_df['day'] = processed_df['date'].dt.day
                processed_df['day_of_week'] = processed_df['date'].dt.dayofweek
                processed_df['hour'] = processed_df['date'].dt.hour
            
            return processed_df
            
        except Exception as e:
            print(f"Error in preprocessing: {e}")
            return df
    
    def predict(self, data: pd.DataFrame) -> Dict:
        """Make predictions using the loaded model"""
        if self.model is None:
            return {"error": "Model not loaded"}
        
        try:
            # Preprocess data
            processed_data = self.preprocess_data(data)
            
            # Select features for prediction (adjust based on your model)
            feature_columns = [col for col in processed_data.columns 
                             if col not in ['date', 'location', 'target']]
            
            if not feature_columns:
                return {"error": "No valid features found for prediction"}
            
            X = processed_data[feature_columns]
            
            # Make predictions
            predictions = self.model.predict(X)
            
            # Calculate confidence intervals if available
            prediction_intervals = None
            if hasattr(self.model, 'predict_quantiles'):
                try:
                    lower_bound = self.model.predict_quantiles(X, quantiles=[0.1])
                    upper_bound = self.model.predict_quantiles(X, quantiles=[0.9])
                    prediction_intervals = {
                        "lower": lower_bound.tolist(),
                        "upper": upper_bound.tolist()
                    }
                except:
                    prediction_intervals = None
            
            result = {
                "predictions": predictions.tolist(),
                "feature_count": len(feature_columns),
                "prediction_intervals": prediction_intervals,
                "timestamp": datetime.now().isoformat()
            }
            
            return result
            
        except Exception as e:
            return {"error": f"Prediction failed: {str(e)}"}
    
    def get_feature_importance(self) -> Dict:
        """Get feature importance from the model"""
        if self.model is None:
            return {"error": "Model not loaded"}
        
        try:
            if hasattr(self.model, 'feature_importances_'):
                feature_names = getattr(self.model, 'feature_names_in_', 
                                      [f"feature_{i}" for i in range(len(self.model.feature_importances_))])
                
                importance_dict = dict(zip(feature_names, self.model.feature_importances_))
                
                # Sort by importance
                sorted_importance = dict(sorted(importance_dict.items(), 
                                              key=lambda x: x[1], reverse=True))
                
                return {
                    "feature_importance": sorted_importance,
                    "total_features": len(feature_names)
                }
            else:
                return {"error": "Model does not support feature importance"}
                
        except Exception as e:
            return {"error": f"Failed to get feature importance: {str(e)}"}
    
    def model_info(self) -> Dict:
        """Get model information"""
        if self.model is None:
            return {"error": "Model not loaded"}
        
        try:
            info = {
                "model_type": type(self.model).__name__,
                "model_path": self.model_path,
                "loaded": True
            }
            
            # Add model-specific information
            if hasattr(self.model, 'n_estimators'):
                info["n_estimators"] = self.model.n_estimators
            
            if hasattr(self.model, 'max_depth'):
                info["max_depth"] = self.model.max_depth
            
            if hasattr(self.model, 'learning_rate'):
                info["learning_rate"] = self.model.learning_rate
            
            if hasattr(self.model, 'feature_names_in_'):
                info["expected_features"] = list(self.model.feature_names_in_)
            
            return info
            
        except Exception as e:
            return {"error": f"Failed to get model info: {str(e)}"}