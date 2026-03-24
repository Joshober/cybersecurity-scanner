# Food Recognition Model Assets

This directory contains the TensorFlow Lite model and labels for food recognition.

## Files Required:

1. **food_classifier.tflite** - The TensorFlow Lite model file for food classification
2. **food_labels.txt** - Text file containing the food class labels (already provided)

## Getting a Food Classification Model:

For production use, you'll need to obtain a pre-trained food classification model:

### Option 1: Use a Pre-trained Model
- Download a food classification model from TensorFlow Hub
- Convert it to TensorFlow Lite format
- Place the `.tflite` file in this directory

### Option 2: Train Your Own Model
- Use a dataset like Food-101 or create your own
- Train using MobileNetV2 or EfficientNet architecture
- Convert to TensorFlow Lite format

### Option 3: Use a Cloud Service
- Consider using Google ML Kit or similar services
- Modify the `FoodRecognitionService` to use cloud APIs instead

## Current Implementation:
The app currently uses a mock recognition system for development. Replace the mock implementation with actual model inference once you have a trained model.

## Model Requirements:
- Input: 224x224x3 RGB image
- Output: Probability scores for each food class
- Format: TensorFlow Lite (.tflite)
- Size: Optimized for mobile deployment
