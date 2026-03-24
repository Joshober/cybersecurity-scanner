import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart';
import 'package:image_picker/image_picker.dart';
// import 'package:file_picker/file_picker.dart'; // Temporarily disabled
import 'package:provider/provider.dart';
import '../../services/food_recognition_service.dart';
import '../../providers/menu_provider.dart';
import '../../config/app_config.dart';
import '../../widgets/manual_food_entry_dialog.dart';
import 'meal_review_screen.dart';

// Conditional imports for mobile-only features
import 'package:camera/camera.dart';

class FoodDetectionScreen extends StatefulWidget {
  const FoodDetectionScreen({super.key});

  @override
  State<FoodDetectionScreen> createState() => _FoodDetectionScreenState();
}

class _FoodDetectionScreenState extends State<FoodDetectionScreen> {
  final FoodRecognitionService _foodService = FoodRecognitionService();
  final ImagePicker _imagePicker = ImagePicker();

  // Mobile-only camera features
  dynamic _cameraController;
  List<dynamic>? _cameras;
  bool _isInitialized = false;

  // Common state
  bool _isRecognizing = false;
  Uint8List? _capturedImageBytes;
  List<FoodRecognitionResult> _manuallyAddedFoods = [];

  @override
  void initState() {
    super.initState();
    if (AppConfig.cameraSupported) {
      _initializeCamera();
    }
    _foodService.initialize();
  }

  Future<void> _initializeCamera() async {
    if (!AppConfig.cameraSupported) return;

    try {
      _cameras = await availableCameras();
      if (_cameras!.isNotEmpty) {
        _cameraController = CameraController(
          _cameras![0],
          ResolutionPreset.high,
          enableAudio: false,
        );

        await _cameraController!.initialize();
        setState(() {
          _isInitialized = true;
        });
      }
    } catch (e) {
      if (kDebugMode) {
        print('Error initializing camera: $e');
      }
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Camera initialization failed: $e')),
      );
    }
  }

  Future<void> _captureAndRecognize() async {
    setState(() {
      _isRecognizing = true;
    });

    try {
      Uint8List? imageBytes;

      if (AppConfig.isWeb) {
        // For web, use image picker with camera source
        final XFile? image = await _imagePicker.pickImage(
          source: ImageSource.camera,
          maxWidth: 1920,
          maxHeight: 1080,
          imageQuality: 85,
        );

        if (image != null) {
          imageBytes = await image.readAsBytes();
        }
      } else {
        // Use camera controller for mobile
        if (_cameraController == null ||
            !_cameraController!.value.isInitialized) {
          setState(() {
            _isRecognizing = false;
          });
          return;
        }

        final XFile image = await _cameraController!.takePicture();
        imageBytes = await image.readAsBytes();
      }

      if (imageBytes != null) {
        setState(() {
          _capturedImageBytes = imageBytes;
        });

        // Get current menu for context
        final menuProvider = context.read<MenuProvider>();
        final currentMenu = menuProvider.currentMenu;

        // Collect hints from manually added foods
        final hints = _manuallyAddedFoods.map((f) => f.foodName).toList();

        // Recognize food with hints
        final results = await _foodService.recognizeFood(
          imageBytes,
          currentMenu: currentMenu,
          location: 'graceland',
          mealType: _getCurrentMealType(),
          hints: hints.isNotEmpty ? hints : null,
        );

        setState(() {
          _isRecognizing = false;
        });

        // Navigate to review screen with both photo results and manually added foods
        if (mounted) {
          final allResults = [..._manuallyAddedFoods, ...results];
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => MealReviewScreen(
                recognitionResults: allResults,
                imageBytes: imageBytes,
              ),
            ),
          );
          // Reset state after navigation
          setState(() {
            _capturedImageBytes = null;
            _manuallyAddedFoods = [];
          });
        }
      } else {
        setState(() {
          _isRecognizing = false;
        });
      }
    } catch (e) {
      setState(() {
        _isRecognizing = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error capturing/recognizing food: $e')),
        );
      }
    }
  }


  Future<void> _addFoodManually() async {
    final result = await showDialog<FoodRecognitionResult>(
      context: context,
      builder: (context) => const ManualFoodEntryDialog(),
    );

    if (result != null) {
      setState(() {
        _manuallyAddedFoods.add(result);
      });
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${result.foodName} added. It will be used as a hint when analyzing photos.'),
            backgroundColor: Colors.green,
            duration: const Duration(seconds: 2),
          ),
        );
      }
    }
  }

  Future<void> _handleCameraCapture() async {
    if (AppConfig.isWeb) {
      // For web, use image picker with camera source
      await _captureAndRecognize();
    } else {
      // Use mobile camera
      await _captureAndRecognize();
    }
  }

  Future<void> _pickImageFromGallery() async {
    try {
      Uint8List? imageBytes;

      if (AppConfig.isWeb) {
        // Web-specific file picking - use image picker for now
        final XFile? image = await _imagePicker.pickImage(
          source: ImageSource.gallery,
          maxWidth: 1920,
          maxHeight: 1080,
          imageQuality: 85,
        );

        if (image != null) {
          imageBytes = await image.readAsBytes();
        }
      } else {
        // Mobile file picking
        final XFile? image = await _imagePicker.pickImage(
          source: ImageSource.gallery,
          maxWidth: 1920,
          maxHeight: 1080,
          imageQuality: 85,
        );

        if (image != null) {
          imageBytes = await image.readAsBytes();
        }
      }

      if (imageBytes != null) {
        setState(() {
          _isRecognizing = true;
          _capturedImageBytes = imageBytes;
        });

        // Get current menu for context
        final menuProvider = context.read<MenuProvider>();
        final currentMenu = menuProvider.currentMenu;

        // Collect hints from manually added foods
        final hints = _manuallyAddedFoods.map((f) => f.foodName).toList();

        // Recognize food with hints
        final results = await _foodService.recognizeFood(
          imageBytes,
          currentMenu: currentMenu,
          location: 'graceland',
          mealType: _getCurrentMealType(),
          hints: hints.isNotEmpty ? hints : null,
        );

        setState(() {
          _isRecognizing = false;
        });

        // Navigate to review screen with both photo results and manually added foods
        if (mounted) {
          final allResults = [..._manuallyAddedFoods, ...results];
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (context) => MealReviewScreen(
                recognitionResults: allResults,
                imageBytes: imageBytes,
              ),
            ),
          );
          // Reset state after navigation
          setState(() {
            _capturedImageBytes = null;
            _manuallyAddedFoods = [];
          });
        }
      }
    } catch (e) {
      setState(() {
        _isRecognizing = false;
      });
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error picking image: $e')),
        );
      }
    }
  }

  String _getCurrentMealType() {
    final hour = DateTime.now().hour;
    if (hour >= 6 && hour < 11) {
      return 'breakfast';
    } else if (hour >= 11 && hour < 16) {
      return 'lunch';
    } else {
      return 'dinner';
    }
  }

  @override
  void dispose() {
    _cameraController?.dispose();
    _foodService.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      appBar: AppBar(
        title: const Text(
          'Food Detection',
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back, color: Colors.grey),
          onPressed: () => Navigator.of(context).pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.info_outline, color: Colors.grey),
            onPressed: _showInfoDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // Header section with instructions
          Container(
            width: double.infinity,
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.05),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: Column(
              children: [
                Icon(
                  Icons.camera_alt,
                  size: 48,
                  color: Theme.of(context).primaryColor,
                ),
                const SizedBox(height: 12),
                Text(
                  'Take a photo of your food',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey[800],
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  'Our AI will identify the food and provide nutrition information',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),

          // Camera/Image view section - full screen
          Expanded(
            child: Container(
              margin: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(16),
                child: _buildCameraView(),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: _buildFloatingCameraButton(),
    );
  }

  Widget _buildCameraView() {
    if (_capturedImageBytes != null) {
      // Show captured image
      return Stack(
        children: [
          Center(
            child: Image.memory(
              _capturedImageBytes!,
              fit: BoxFit.cover,
              width: double.infinity,
              height: double.infinity,
            ),
          ),
          if (_isRecognizing)
            Container(
              color: Colors.black54,
              child: const Center(
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    CircularProgressIndicator(color: Colors.white),
                    SizedBox(height: 16),
                    Text(
                      'Recognizing food...',
                      style: TextStyle(color: Colors.white, fontSize: 16),
                    ),
                  ],
                ),
              ),
            ),
        ],
      );
    } else if (AppConfig.isWeb) {
      // Show web camera placeholder
      return Container(
        color: Colors.grey[100],
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.camera_alt,
                  size: 64,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                'Click the camera button below to take a photo',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Or use the gallery button to select an existing photo',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    } else if (AppConfig.cameraSupported &&
        _isInitialized &&
        _cameraController != null) {
      // Show camera preview (mobile only)
      return CameraPreview(_cameraController!);
    } else {
      // Show platform-appropriate placeholder
      return Container(
        color: Colors.grey[100],
        child: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  Icons.camera_alt,
                  size: 64,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 20),
              Text(
                AppConfig.isWeb
                    ? 'Click the camera button below to take a photo'
                    : 'Camera not available',
                style: TextStyle(
                  fontSize: 16,
                  color: Colors.grey[600],
                  fontWeight: FontWeight.w500,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                'Or use the gallery button to select an existing photo',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[500],
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      );
    }
  }


  Widget _buildFloatingCameraButton() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceEvenly,
      children: [
        // Gallery/Upload button
        FloatingActionButton(
          heroTag: 'gallery',
          onPressed: _isRecognizing ? null : _pickImageFromGallery,
          backgroundColor: Colors.blue[600],
          child: Icon(
            AppConfig.isWeb ? Icons.upload_file : Icons.photo_library,
            color: Colors.white,
          ),
        ),

        // Main camera button
        FloatingActionButton.large(
          heroTag: 'capture',
          onPressed: _isRecognizing ? null : _handleCameraCapture,
          backgroundColor: Theme.of(context).primaryColor,
          child: Icon(
            Icons.camera_alt,
            color: Colors.white,
            size: 32,
          ),
        ),

        // Add food manually button
        FloatingActionButton(
          heroTag: 'add_food',
          onPressed: _isRecognizing ? null : _addFoodManually,
          backgroundColor: Colors.orange,
          child: Stack(
            children: [
              const Icon(Icons.add, color: Colors.white),
              if (_manuallyAddedFoods.isNotEmpty)
                Positioned(
                  right: 0,
                  top: 0,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    constraints: const BoxConstraints(
                      minWidth: 16,
                      minHeight: 16,
                    ),
                    child: Text(
                      '${_manuallyAddedFoods.length}',
                      style: const TextStyle(
                        color: Colors.white,
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                      textAlign: TextAlign.center,
                    ),
                  ),
                ),
            ],
          ),
        ),
      ],
    );
  }




  void _showInfoDialog() {
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Food Detection Info'),
          content: const Text(
            'This feature uses AI to identify food in your photos and provide nutrition information. '
            'Take a clear photo of your food for best results.',
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('OK'),
            ),
          ],
        );
      },
    );
  }
}
