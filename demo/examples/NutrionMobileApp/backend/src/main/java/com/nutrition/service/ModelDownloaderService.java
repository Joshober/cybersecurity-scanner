package com.nutrition.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.*;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

/**
 * Service to automatically download ONNX models if they don't exist
 */
@Service
public class ModelDownloaderService {
    
    private static final Logger logger = LoggerFactory.getLogger(ModelDownloaderService.class);
    
    @Value("${ml.onnx.models-path:classpath:models/}")
    private String modelsPath;
    
    @Value("${ml.onnx.food-classification-model:food_classifier.onnx}")
    private String modelFileName;
    
    @Value("${ml.onnx.auto-download:true}")
    private boolean autoDownload;
    
    @Value("${ml.onnx.model-download-url:}")
    private String modelDownloadUrl;
    
    // Default model: Using Food-101 ResNet50 model (food-specific, best accuracy)
    // Try multiple sources for reliability - if one fails, try the next
    private static final String[] DEFAULT_MODEL_URLS = {
        // Primary: Food-101 ResNet50 model from GitHub Releases (food-specific, best accuracy)
        "https://github.com/Joshober/NutrionMobileApp/releases/download/v1.0.0-food101-model/food101_resnet50.onnx",
        // Alternative: Hugging Face Food-101 model
        "https://huggingface.co/anonauthors/food101-resnet50/resolve/main/food101-resnet50.onnx",
        // Fallback: General ImageNet models (less accurate for food, but available)
        "https://github.com/onnx/models/raw/main/vision/classification/efficientnet-lite4/model/efficientnet-lite4-11.onnx",
        "https://raw.githubusercontent.com/onnx/models/main/vision/classification/efficientnet-lite4/model/efficientnet-lite4-11.onnx",
        "https://github.com/onnx/models/raw/main/vision/classification/mobilenet/model/mobilenetv2-12.onnx"
    };
    private static final String DEFAULT_LABELS_URL = "https://raw.githubusercontent.com/onnx/models/main/vision/classification/synset.txt";
    
    private static final String LABELS_FILE = "food_labels.txt";
    
    /**
     * Ensure model file exists, download if needed
     */
    public boolean ensureModelExists() {
        if (!autoDownload) {
            // Auto-download disabled - no logging needed
            return false;
        }
        
        try {
            // Check if model exists in resources
            ClassPathResource modelResource = new ClassPathResource(modelsPath + modelFileName);
            if (modelResource.exists()) {
                // Model exists in resources - no logging needed
                return true;
            }
            
            // Check if model exists in writable location
            Path writableModelPath = getWritableModelPath();
            if (Files.exists(writableModelPath)) {
                // Model exists - no logging needed
                return true;
            }
            
            // Model doesn't exist, try to download
            // Model not found, attempting download
            return downloadModel();
            
        } catch (Exception e) {
            logger.error("Error checking/downloading model: {}", e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Download model from URL
     */
    private boolean downloadModel() {
        // Use custom URL if provided, otherwise try default URLs
        String[] urlsToTry;
        if (modelDownloadUrl != null && !modelDownloadUrl.isEmpty()) {
            urlsToTry = new String[]{modelDownloadUrl};
        } else {
            urlsToTry = DEFAULT_MODEL_URLS;
        }
        
        // Create models directory if it doesn't exist
        Path writableModelPath = getWritableModelPath();
        Path modelsDir = writableModelPath.getParent();
        if (modelsDir != null && !Files.exists(modelsDir)) {
            try {
                Files.createDirectories(modelsDir);
                // Created models directory
            } catch (IOException e) {
                logger.error("Failed to create models directory: {}", e.getMessage());
                return false;
            }
        }
        
        // Try each URL until one works
        for (String url : urlsToTry) {
            try {
                // Attempting download from: url (logged only on success)
                downloadFile(url, writableModelPath);
                
                // Verify the file was downloaded correctly
                if (!Files.exists(writableModelPath)) {
                    throw new IOException("Model file was not created at " + writableModelPath);
                }
                long fileSize = Files.size(writableModelPath);
                if (fileSize == 0) {
                    throw new IOException("Downloaded model file is empty");
                }
                
                // Check if file is actually HTML (GitHub error page)
                String firstBytes = new String(Files.readAllBytes(writableModelPath), 0, Math.min(100, (int)fileSize));
                if (firstBytes.trim().startsWith("<!DOCTYPE") || firstBytes.trim().startsWith("<html")) {
                    throw new IOException("Downloaded file appears to be HTML (error page), not a model file");
                }
                
                logger.info("Model downloaded: {} bytes", fileSize);
                
                // Download labels if they don't exist
                ensureLabelsExist();
                
                return true;
            } catch (Exception e) {
                // Only log warning, not error, to reduce log volume
                logger.warn("Failed to download from {}: {}", url, e.getMessage());
                // Delete partial download if it exists
                try {
                    if (Files.exists(writableModelPath)) {
                        Files.delete(writableModelPath);
                    }
                } catch (Exception deleteEx) {
                    // Ignore delete errors
                }
                // Continue to next URL
            }
        }
        
        // All URLs failed - log once, not per attempt
        logger.warn("Failed to download ONNX model from all sources. Set ML_MODEL_DOWNLOAD_URL environment variable with a valid model URL.");
        return false;
    }
    
    /**
     * Download labels file if it doesn't exist
     */
    private void ensureLabelsExist() {
        try {
            Path labelsPath = getWritableLabelsPath();
            
            // Check if Food-101 labels exist in resources (preferred)
            ClassPathResource food101LabelsResource = new ClassPathResource("models/food_labels_food101.txt");
            if (food101LabelsResource.exists()) {
                try {
                    // Copy Food-101 labels to writable location
                    try (InputStream inputStream = food101LabelsResource.getInputStream()) {
                        Files.copy(inputStream, labelsPath, java.nio.file.StandardCopyOption.REPLACE_EXISTING);
                        // Using Food-101 labels from resources
                        return;
                    }
                } catch (Exception e) {
                    logger.warn("Could not copy Food-101 labels: {}", e.getMessage());
                }
            }
            
            // Check if labels exist in resources
            ClassPathResource labelsResource = new ClassPathResource("models/" + LABELS_FILE);
            if (labelsResource.exists()) {
                // Labels exist in resources
                return;
            }
            
            // Check if labels exist in writable location
            if (Files.exists(labelsPath)) {
                // Labels exist
                return;
            }
            
            // Try to download labels
            // Downloading labels file
            downloadFile(DEFAULT_LABELS_URL, labelsPath);
            
            // Convert ImageNet labels to food labels (simplified)
            convertToFoodLabels(labelsPath);
            
            // Labels downloaded successfully
            
        } catch (Exception e) {
            logger.warn("Could not download labels, will use default labels: {}", e.getMessage());
            createDefaultLabels();
        }
    }
    
    /**
     * Convert ImageNet labels to food labels (comprehensive mapping)
     * Maps ImageNet synset labels to food categories
     */
    private void convertToFoodLabels(Path labelsPath) throws IOException {
        // Read all labels
        String content = Files.readString(labelsPath);
        String[] lines = content.split("\n");
        
        // Comprehensive food keyword mapping (ImageNet to food names)
        Map<String, String> foodMapping = new HashMap<>();
        foodMapping.put("n07753592", "banana");
        foodMapping.put("n07747607", "orange");
        foodMapping.put("n07768694", "apple");
        foodMapping.put("n07749582", "lemon");
        foodMapping.put("n07760859", "fig");
        foodMapping.put("n07753275", "pineapple");
        foodMapping.put("n07754684", "strawberry");
        foodMapping.put("n07720875", "bell_pepper");
        foodMapping.put("n07734744", "mushroom");
        foodMapping.put("n07711569", "cauliflower");
        foodMapping.put("n07714571", "broccoli");
        foodMapping.put("n07714990", "cabbage");
        foodMapping.put("n07715103", "carrot");
        foodMapping.put("n07716358", "zucchini");
        foodMapping.put("n07717410", "cucumber");
        foodMapping.put("n07718472", "eggplant");
        foodMapping.put("n07730033", "corn");
        foodMapping.put("n07742313", "potato");
        foodMapping.put("n07745940", "sweet_potato");
        foodMapping.put("n07753113", "tomato");
        foodMapping.put("n07873807", "pizza");
        foodMapping.put("n07880968", "burger");
        foodMapping.put("n07875152", "hot_dog");
        foodMapping.put("n07880968", "hamburger");
        foodMapping.put("n07693725", "bagel");
        foodMapping.put("n07695742", "pretzel");
        foodMapping.put("n07697313", "cheeseburger");
        foodMapping.put("n07697537", "hot_dog");
        foodMapping.put("n07716906", "spaghetti");
        foodMapping.put("n07718747", "ravioli");
        foodMapping.put("n07730033", "corn");
        foodMapping.put("n07734744", "mushroom");
        foodMapping.put("n07802026", "meat_loaf");
        foodMapping.put("n07831146", "chocolate_sauce");
        foodMapping.put("n07836838", "chocolate_cake");
        foodMapping.put("n07860988", "doughnut");
        foodMapping.put("n07871810", "meat_loaf");
        foodMapping.put("n07873807", "pizza");
        foodMapping.put("n07875152", "hot_dog");
        foodMapping.put("n07880968", "burrito");
        foodMapping.put("n09428293", "seashore"); // Not food, but keeping for reference
        
        // Food keywords to search for in labels
        String[] foodKeywords = {
            "apple", "banana", "orange", "strawberry", "watermelon", "tomato", "grape",
            "pizza", "hamburger", "hot dog", "sandwich", "ice cream", "cake", "bread",
            "cheese", "chicken", "steak", "fish", "rice", "pasta", "spaghetti", "noodle",
            "salad", "broccoli", "carrot", "corn", "egg", "soup", "coffee", "tea",
            "potato", "french fries", "burger", "burrito", "taco", "sushi", "sashimi",
            "mushroom", "onion", "pepper", "lettuce", "cucumber", "avocado"
        };
        
        StringBuilder foodLabels = new StringBuilder();
        Set<String> addedFoods = new HashSet<>();
        
        // First, try to map by synset ID
        for (String line : lines) {
            String trimmed = line.trim();
            if (trimmed.isEmpty()) continue;
            
            // Extract synset ID if present (format: n07753592 banana)
            String[] parts = trimmed.split("\\s+", 2);
            if (parts.length >= 1) {
                String synsetId = parts[0];
                if (foodMapping.containsKey(synsetId)) {
                    String foodName = foodMapping.get(synsetId);
                    if (!addedFoods.contains(foodName)) {
                        foodLabels.append(foodName).append("\n");
                        addedFoods.add(foodName);
                    }
                }
            }
        }
        
        // Then, search by keywords in label text
        for (String line : lines) {
            String lowerLine = line.toLowerCase();
            for (String keyword : foodKeywords) {
                if (lowerLine.contains(keyword.toLowerCase())) {
                    // Extract food name
                    String foodName = keyword.replace(" ", "_");
                    if (!addedFoods.contains(foodName)) {
                        foodLabels.append(foodName).append("\n");
                        addedFoods.add(foodName);
                    }
                    break;
                }
            }
        }
        
        // If we found food labels, use them; otherwise use defaults
        if (foodLabels.length() == 0 || addedFoods.size() < 10) {
            logger.warn("Could not extract enough food labels from ImageNet, using default food labels");
            createDefaultLabels();
        } else {
            Files.writeString(labelsPath, foodLabels.toString());
            // Extracted food labels from ImageNet
        }
    }
    
    /**
     * Create default food labels file
     */
    private void createDefaultLabels() {
        try {
            Path labelsPath = getWritableLabelsPath();
            Path labelsDir = labelsPath.getParent();
            if (labelsDir != null && !Files.exists(labelsDir)) {
                Files.createDirectories(labelsDir);
            }
            
            String defaultLabels = String.join("\n",
                "apple", "banana", "bread", "broccoli", "carrot", "chicken", "corn", "egg",
                "french_fries", "hamburger", "hot_dog", "ice_cream", "orange", "pizza",
                "rice", "salad", "sandwich", "soup", "steak", "strawberry", "tomato",
                "watermelon", "pasta", "cheese", "yogurt", "milk", "coffee", "tea",
                "cake", "cookie", "donut", "muffin"
            );
            
            Files.writeString(labelsPath, defaultLabels);
            // Created default labels file
            
        } catch (Exception e) {
            logger.error("Failed to create default labels: {}", e.getMessage());
        }
    }
    
    /**
     * Download file from URL to local path
     * Handles HTTP redirects (301, 302, 303, 307, 308) which are common with GitHub releases
     */
    private void downloadFile(String fileUrl, Path savePath) throws IOException {
        String finalUrl = followRedirects(fileUrl);
        URL url = new URL(finalUrl);
        HttpURLConnection connection = (HttpURLConnection) url.openConnection();
        connection.setConnectTimeout(30000); // 30 seconds
        connection.setReadTimeout(60000); // 60 seconds
        connection.setRequestProperty("User-Agent", "Mozilla/5.0 (compatible; NutritionApp-ModelDownloader/1.0)");
        connection.setRequestProperty("Accept", "*/*");
        
        int responseCode = connection.getResponseCode();
        if (responseCode != HttpURLConnection.HTTP_OK) {
            // Try to get error stream for more details
            InputStream errorStream = connection.getErrorStream();
            String errorDetails = "";
            if (errorStream != null) {
                try {
                    errorDetails = new String(errorStream.readAllBytes());
                } catch (Exception e) {
                    // Ignore
                }
            }
            throw new IOException("Failed to download file: HTTP " + responseCode + 
                (errorDetails.isEmpty() ? "" : " - " + errorDetails));
        }
        
        // Check content length for progress tracking
        long contentLength = connection.getContentLengthLong();
        if (contentLength > 0) {
            // Downloading model file
        }
        
        try (InputStream inputStream = connection.getInputStream();
             FileOutputStream outputStream = new FileOutputStream(savePath.toFile())) {
            
            byte[] buffer = new byte[8192];
            int bytesRead;
            long totalBytes = 0;
            
            while ((bytesRead = inputStream.read(buffer)) != -1) {
                outputStream.write(buffer, 0, bytesRead);
                totalBytes += bytesRead;
                
                // Log progress for large files
                if (contentLength > 0 && totalBytes % (10 * 1024 * 1024) == 0) {
                    // Download progress (suppressed to reduce logs)
                }
            }
            
            // Download completed
            
            // Verify file was written
            if (!Files.exists(savePath) || Files.size(savePath) == 0) {
                throw new IOException("Downloaded file is empty or was not written correctly");
            }
            
        } catch (IOException e) {
            throw new IOException("Error downloading file from " + fileUrl + ": " + e.getMessage(), e);
        }
    }
    
    /**
     * Follow HTTP redirects to get the final URL
     * GitHub releases often redirect to CDN URLs
     */
    private String followRedirects(String url) throws IOException {
        int maxRedirects = 5;
        int redirectCount = 0;
        String currentUrl = url;
        
        while (redirectCount < maxRedirects) {
            URL urlObj = new URL(currentUrl);
            HttpURLConnection connection = (HttpURLConnection) urlObj.openConnection();
            connection.setConnectTimeout(10000); // 10 seconds for redirect check
            connection.setReadTimeout(10000);
            connection.setRequestProperty("User-Agent", "Mozilla/5.0 (compatible; NutritionApp-ModelDownloader/1.0)");
            connection.setInstanceFollowRedirects(false); // We'll handle redirects manually
            
            int responseCode = connection.getResponseCode();
            
            // Check if it's a redirect
            if (responseCode == HttpURLConnection.HTTP_MOVED_PERM || 
                responseCode == HttpURLConnection.HTTP_MOVED_TEMP ||
                responseCode == HttpURLConnection.HTTP_SEE_OTHER ||
                responseCode == 307 || // Temporary Redirect
                responseCode == 308) { // Permanent Redirect
                
                String location = connection.getHeaderField("Location");
                if (location != null && !location.isEmpty()) {
                    // Handle relative redirects
                    if (location.startsWith("/")) {
                        URL baseUrl = new URL(currentUrl);
                        currentUrl = baseUrl.getProtocol() + "://" + baseUrl.getHost() + location;
                    } else if (!location.startsWith("http")) {
                        URL baseUrl = new URL(currentUrl);
                        currentUrl = baseUrl.getProtocol() + "://" + baseUrl.getHost() + "/" + location;
                    } else {
                        currentUrl = location;
                    }
                    redirectCount++;
                    // Following redirect (suppressed)
                    connection.disconnect();
                    continue;
                }
            }
            
            // Not a redirect, return the current URL
            connection.disconnect();
            if (redirectCount > 0) {
                // Final URL after redirects
            }
            return currentUrl;
        }
        
        throw new IOException("Too many redirects (max " + maxRedirects + ") for URL: " + url);
    }
    
    /**
     * Get writable path for model file (outside JAR/resources)
     */
    private Path getWritableModelPath() {
        // Use ./models/ directory in working directory
        return Paths.get("models", modelFileName);
    }
    
    /**
     * Get writable path for labels file
     */
    private Path getWritableLabelsPath() {
        return Paths.get("models", LABELS_FILE);
    }
    
    /**
     * Get model path (checks writable location first, then resources)
     */
    public Path getModelPath() {
        Path writablePath = getWritableModelPath();
        if (Files.exists(writablePath)) {
            return writablePath;
        }
        
        // Fallback to resources (read-only)
        ClassPathResource resource = new ClassPathResource(modelsPath + modelFileName);
        if (resource.exists()) {
            try {
                return Paths.get(resource.getURI());
            } catch (Exception e) {
                logger.warn("Could not get resource URI: {}", e.getMessage());
            }
        }
        
        return writablePath; // Return expected path even if doesn't exist
    }
    
    /**
     * Get labels path (checks writable location first, then resources)
     */
    public Path getLabelsPath() {
        Path writablePath = getWritableLabelsPath();
        if (Files.exists(writablePath)) {
            return writablePath;
        }
        
        ClassPathResource resource = new ClassPathResource("models/" + LABELS_FILE);
        if (resource.exists()) {
            try {
                return Paths.get(resource.getURI());
            } catch (Exception e) {
                logger.warn("Could not get resource URI: {}", e.getMessage());
            }
        }
        
        return writablePath;
    }
}

