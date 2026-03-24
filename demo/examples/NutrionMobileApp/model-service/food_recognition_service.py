import tensorflow as tf
import numpy as np
from PIL import Image
import io
import logging
import os
from typing import List, Dict, Any
import json

logger = logging.getLogger(__name__)

class FoodRecognitionResult:
    def __init__(self, food_name: str, confidence: float, is_from_menu: bool = False):
        self.food_name = food_name
        self.confidence = confidence
        self.is_from_menu = is_from_menu

class FoodRecognitionService:
    def __init__(self):
        self.model = None
        self.labels = []
        self.is_model_loaded = False
        self.model_path = "/app/models/food_classifier.tflite"
        self.labels_path = "/app/models/food_labels.txt"
        
    async def initialize(self):
        """Initialize the TensorFlow Lite model and load labels"""
        try:
            # Check if model files exist
            if not os.path.exists(self.model_path):
                logger.warning(f"Model file not found at {self.model_path}, using mock implementation")
                await self._initialize_mock()
                return
                
            if not os.path.exists(self.labels_path):
                logger.warning(f"Labels file not found at {self.labels_path}, using default labels")
                self.labels = self._get_default_labels()
            else:
                # Load labels from file
                with open(self.labels_path, 'r') as f:
                    self.labels = [line.strip() for line in f.readlines() if line.strip()]
            
            # Load TensorFlow Lite model
            self.interpreter = tf.lite.Interpreter(model_path=self.model_path)
            self.interpreter.allocate_tensors()
            
            # Get input and output details
            self.input_details = self.interpreter.get_input_details()
            self.output_details = self.interpreter.get_output_details()
            
            self.is_model_loaded = True
            logger.info(f"Model loaded successfully with {len(self.labels)} labels")
            
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            logger.info("Falling back to mock implementation")
            await self._initialize_mock()
    
    async def _initialize_mock(self):
        """Initialize mock implementation for development"""
        self.labels = self._get_default_labels()
        self.is_model_loaded = True
        logger.info("Mock food recognition service initialized")
    
    def _get_default_labels(self) -> List[str]:
        """Get default food labels"""
        return [
            "apple", "banana", "bread", "broccoli", "carrot", "chicken", "corn", "egg",
            "french_fries", "hamburger", "hot_dog", "ice_cream", "orange", "pizza",
            "rice", "salad", "sandwich", "soup", "steak", "strawberry", "tomato",
            "watermelon", "pasta", "cheese", "yogurt", "milk", "coffee", "tea",
            "cake", "cookie", "donut", "muffin"
        ]
    
    def is_initialized(self) -> bool:
        """Check if the service is initialized"""
        return self.is_model_loaded
    
    def get_food_labels(self) -> List[str]:
        """Get the list of food labels"""
        return self.labels
    
    def get_model_info(self) -> Dict[str, Any]:
        """Get information about the loaded model"""
        if not self.is_model_loaded:
            return {"status": "not_loaded"}
        
        info = {
            "status": "loaded",
            "labels_count": len(self.labels),
            "model_type": "tensorflow_lite" if hasattr(self, 'interpreter') else "mock"
        }
        
        if hasattr(self, 'interpreter'):
            info.update({
                "input_shape": self.input_details[0]['shape'],
                "output_shape": self.output_details[0]['shape']
            })
        
        return info
    
    async def recognize_food(
        self, 
        image_data: bytes, 
        location: str = "graceland", 
        meal_type: str = "lunch"
    ) -> List[Dict[str, Any]]:
        """
        Recognize food items in the provided image data
        """
        try:
            if not self.is_model_loaded:
                raise Exception("Service not initialized")
            
            # Process image
            image = self._preprocess_image(image_data)
            
            if hasattr(self, 'interpreter'):
                # Use TensorFlow Lite model
                results = self._run_tflite_inference(image)
            else:
                # Use mock implementation
                results = self._run_mock_inference(image)
            
            # Format results
            formatted_results = []
            for result in results:
                formatted_results.append({
                    "food_name": result.food_name,
                    "confidence": result.confidence,
                    "is_from_menu": result.is_from_menu
                })
            
            return formatted_results
            
        except Exception as e:
            logger.error(f"Error in food recognition: {e}")
            raise
    
    def _preprocess_image(self, image_data: bytes) -> np.ndarray:
        """Preprocess image for model inference"""
        try:
            # Load image from bytes
            image = Image.open(io.BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Resize to model input size (224x224 for most food classification models)
            image = image.resize((224, 224))
            
            # Convert to numpy array and normalize
            image_array = np.array(image, dtype=np.float32)
            image_array = image_array / 255.0  # Normalize to [0, 1]
            
            # Add batch dimension
            image_array = np.expand_dims(image_array, axis=0)
            
            return image_array
            
        except Exception as e:
            logger.error(f"Error preprocessing image: {e}")
            raise
    
    def _run_tflite_inference(self, image: np.ndarray) -> List[FoodRecognitionResult]:
        """Run inference using TensorFlow Lite model"""
        try:
            # Set input tensor
            self.interpreter.set_tensor(self.input_details[0]['index'], image)
            
            # Run inference
            self.interpreter.invoke()
            
            # Get output
            output_data = self.interpreter.get_tensor(self.output_details[0]['index'])
            
            # Process results
            predictions = output_data[0]  # Remove batch dimension
            
            # Get top 5 predictions
            top_indices = np.argsort(predictions)[-5:][::-1]
            
            results = []
            for idx in top_indices:
                if idx < len(self.labels):
                    confidence = float(predictions[idx])
                    food_name = self.labels[idx]
                    is_from_menu = self._is_food_from_menu(food_name)
                    
                    results.append(FoodRecognitionResult(
                        food_name=food_name,
                        confidence=confidence,
                        is_from_menu=is_from_menu
                    ))
            
            return results
            
        except Exception as e:
            logger.error(f"Error in TensorFlow Lite inference: {e}")
            raise
    
    def _run_mock_inference(self, image: np.ndarray) -> List[FoodRecognitionResult]:
        """Run mock inference for development"""
        import random
        
        # Simulate inference with random results
        num_foods = random.randint(1, 3)
        selected_foods = random.sample(self.labels, min(num_foods, len(self.labels)))
        
        results = []
        for food_name in selected_foods:
            confidence = random.uniform(0.6, 0.95)
            is_from_menu = self._is_food_from_menu(food_name)
            
            results.append(FoodRecognitionResult(
                food_name=food_name,
                confidence=confidence,
                is_from_menu=is_from_menu
            ))
        
        # Sort by confidence
        results.sort(key=lambda x: x.confidence, reverse=True)
        
        return results
    
    def _is_food_from_menu(self, food_name: str) -> bool:
        """Check if the food item is likely to be from the current menu"""
        # This is a simplified check - in a real implementation, you would
        # check against the actual dining hall menu
        menu_foods = [
            "pizza", "burger", "salad", "pasta", "chicken", "rice", 
            "sandwich", "soup", "steak", "fish", "broccoli", "carrot"
        ]
        
        return food_name.lower() in menu_foods