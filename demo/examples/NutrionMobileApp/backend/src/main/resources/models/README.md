# Model Files Directory

Place your ONNX model files here for local food recognition.

## Required Files

### 1. Food Classification Model
- **File**: `food_classifier.onnx` (or name specified in `ONNX_MODEL_NAME`)
- **Format**: ONNX model file
- **Input**: `[1, 224, 224, 3]` float32 array (RGB image, normalized 0-1)
- **Output**: `[1, num_classes]` float32 array (confidence scores per food class)

### 2. Food Labels
- **File**: `food_labels.txt`
- **Format**: One food name per line
- **Order**: Must match the output indices of your model
- **Example**:
  ```
  apple
  banana
  bread
  chicken
  pizza
  ```

## Model Conversion

### From TensorFlow/Keras:
```python
import tensorflow as tf
import tf2onnx

model = tf.keras.models.load_model('food_classifier.h5')
onnx_model = tf2onnx.convert.from_keras(model, output_path='food_classifier.onnx')
```

### From PyTorch:
```python
import torch

model = torch.load('food_classifier.pth')
dummy_input = torch.randn(1, 3, 224, 224)
torch.onnx.export(model, dummy_input, "food_classifier.onnx", 
                  input_names=['input'], output_names=['output'])
```

## Testing Without a Model

If no model file is present, the service will use a mock implementation that:
- Returns random food items from the labels file
- Provides realistic confidence scores
- Estimates portion sizes based on food type

This is useful for development and testing.

