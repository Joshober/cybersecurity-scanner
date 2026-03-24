package com.nutrition.config;

import com.nutrition.service.ModelDownloaderService;
import com.nutrition.service.OnnxFoodRecognitionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "ml.mode", havingValue = "local", matchIfMissing = false)
public class OnnxModelConfig implements CommandLineRunner {
    
    private static final Logger logger = LoggerFactory.getLogger(OnnxModelConfig.class);
    
    @Autowired
    private OnnxFoodRecognitionService onnxFoodRecognitionService;
    
    @Autowired(required = false)
    private ModelDownloaderService modelDownloaderService;
    
    @Override
    public void run(String... args) throws Exception {
        try {
            logger.info("Initializing ONNX Food Recognition service...");
            
            // Ensure model exists (download if needed)
            if (modelDownloaderService != null) {
                modelDownloaderService.ensureModelExists();
            }
            
            onnxFoodRecognitionService.initialize();
            if (onnxFoodRecognitionService.isUsingRealModel()) {
                logger.info("ONNX Food Recognition service initialized successfully with model");
            } else {
                logger.warn("ONNX Food Recognition service initialized without model. Model download may have failed. Using mock implementation.");
                // Don't fail startup - allow app to run without model
                // User can set ML_MODEL_DOWNLOAD_URL environment variable to provide model
            }
        } catch (Exception e) {
            logger.error("Failed to initialize ONNX Food Recognition service: {}", e.getMessage());
            logger.warn("Continuing without ONNX model. Set ML_MODEL_DOWNLOAD_URL environment variable to provide model.");
            // Don't fail startup - allow app to run without model
        }
    }
}

