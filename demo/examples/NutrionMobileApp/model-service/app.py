from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import logging
from food_recognition_service import FoodRecognitionService
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="Food Recognition Model Service",
    description="Microservice for food recognition using TensorFlow Lite models",
    version="1.0.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize the food recognition service
food_service = FoodRecognitionService()

@app.on_event("startup")
async def startup_event():
    """Initialize the model service on startup"""
    try:
        await food_service.initialize()
        logger.info("Food recognition service initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize food recognition service: {e}")
        raise

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "food-recognition-model",
        "model_loaded": food_service.is_initialized()
    }

@app.post("/recognize")
async def recognize_food(
    image: UploadFile = File(...),
    location: str = Form("graceland"),
    meal_type: str = Form("lunch")
):
    """
    Recognize food items in an uploaded image
    """
    try:
        # Validate image file
        if not image.content_type.startswith('image/'):
            raise HTTPException(status_code=400, detail="File must be an image")
        
        # Read image data
        image_data = await image.read()
        
        # Perform food recognition
        results = await food_service.recognize_food(
            image_data=image_data,
            location=location,
            meal_type=meal_type
        )
        
        return {
            "success": True,
            "results": results,
            "location": location,
            "meal_type": meal_type
        }
        
    except Exception as e:
        logger.error(f"Error in food recognition: {e}")
        raise HTTPException(status_code=500, detail=f"Food recognition failed: {str(e)}")

@app.get("/labels")
async def get_food_labels():
    """Get available food labels"""
    try:
        labels = food_service.get_food_labels()
        return {
            "success": True,
            "labels": labels,
            "label_count": len(labels)
        }
    except Exception as e:
        logger.error(f"Error getting food labels: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get food labels: {str(e)}")

@app.get("/model-info")
async def get_model_info():
    """Get information about the loaded model"""
    try:
        info = food_service.get_model_info()
        return {
            "success": True,
            "model_info": info
        }
    except Exception as e:
        logger.error(f"Error getting model info: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to get model info: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
