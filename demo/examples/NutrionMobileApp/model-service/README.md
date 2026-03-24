# Food Recognition Model Service

This is a microservice that handles food recognition using TensorFlow Lite models. It's designed to be deployed as a separate Docker container to avoid rebuilding the backend when the model changes.

## Architecture

The model service is a FastAPI-based Python application that:
- Loads TensorFlow Lite models for food classification
- Provides REST API endpoints for food recognition
- Handles image preprocessing and model inference
- Falls back to mock implementation when models are not available

## API Endpoints

### Health Check
- **GET** `/health` - Check if the service is healthy and model is loaded

### Food Recognition
- **POST** `/recognize` - Recognize food items in an uploaded image
  - Form data:
    - `image`: Image file (multipart/form-data)
    - `location`: Location string (optional, default: "graceland")
    - `meal_type`: Meal type (optional, default: "lunch")

### Model Information
- **GET** `/labels` - Get available food labels
- **GET** `/model-info` - Get information about the loaded model

## Model Files

The service expects the following files in the `/app/models/` directory:
- `food_classifier.tflite` - TensorFlow Lite model file
- `food_labels.txt` - Text file with food class labels (one per line)

## Docker Deployment

The service is containerized and can be deployed using Docker Compose:

```bash
# Build and run the model service
docker-compose up model-service

# Or run the entire stack
docker-compose up
```

## Environment Variables

- `MODEL_SERVICE_URL` - URL of the model service (used by backend)
- Default: `http://model-service:8000` (Docker internal network)

## Fallback Behavior

If the model files are not available or the service fails to load them:
- The service will use a mock implementation
- Mock results are generated with realistic food names and confidence scores
- The service remains functional for development and testing

## Integration with Backend

The Spring Boot backend communicates with this service via HTTP:
- Backend calls the model service for food recognition
- If the model service is unavailable, backend falls back to mock implementation
- This ensures the application remains functional even if the model service is down

## Development

To run locally for development:

```bash
# Install dependencies
pip install -r requirements.txt

# Run the service
python app.py
```

The service will be available at `http://localhost:8000`

## Model Requirements

- Input: 224x224x3 RGB image
- Output: Probability scores for each food class
- Format: TensorFlow Lite (.tflite)
- Size: Optimized for deployment

## Benefits of Separate Model Service

1. **Independent Scaling**: Model service can be scaled separately from the backend
2. **Faster Backend Rebuilds**: Backend can be rebuilt without downloading large model files
3. **Model Versioning**: Different model versions can be deployed independently
4. **Resource Optimization**: Model service can be allocated specific CPU/memory resources
5. **Fault Tolerance**: Backend continues to work even if model service is down
