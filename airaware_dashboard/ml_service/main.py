from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import pandas as pd
from model_service import MLModelService
import json

app = FastAPI(title="AirAware ML Service", description="Machine Learning Service for Air Quality Prediction", version="1.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML service
ml_service = MLModelService()

# Pydantic models
class PredictionRequest(BaseModel):
    data: List[Dict]
    features: Optional[List[str]] = None

class PredictionResponse(BaseModel):
    predictions: List[float]
    feature_count: int
    prediction_intervals: Optional[Dict] = None
    timestamp: str

@app.get("/")
async def root():
    return {"message": "AirAware ML Service is running"}

@app.get("/model/info")
async def get_model_info():
    """Get information about the loaded model"""
    try:
        info = ml_service.model_info()
        return info
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/model/feature-importance")
async def get_feature_importance():
    """Get feature importance from the model"""
    try:
        importance = ml_service.get_feature_importance()
        return importance
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict")
async def make_prediction(request: PredictionRequest):
    """Make predictions using the loaded model"""
    try:
        # Convert request data to DataFrame
        df = pd.DataFrame(request.data)
        
        if df.empty:
            raise HTTPException(status_code=400, detail="No data provided for prediction")
        
        # Make prediction
        result = ml_service.predict(df)
        
        if "error" in result:
            raise HTTPException(status_code=400, detail=result["error"])
        
        return result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        model_status = ml_service.model is not None
        return {
            "status": "healthy" if model_status else "unhealthy",
            "model_loaded": model_status,
            "service": "ml_service"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "model_loaded": False,
            "error": str(e)
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)