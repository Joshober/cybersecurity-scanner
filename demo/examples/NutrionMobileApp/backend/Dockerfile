# Multi-stage build for Spring Boot application
FROM maven:3.8-openjdk-17-slim AS build

# Set working directory
WORKDIR /app

# Copy pom.xml first for better caching
COPY pom.xml .

# Download dependencies
RUN mvn dependency:go-offline -B

# Copy source code
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -Dmaven.test.skip=true

# Runtime stage - using Debian-based image for glibc support (required for ONNX Runtime)
FROM eclipse-temurin:17-jdk

# Install curl for health checks (Debian uses apt-get)
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Create models directory (optional - for local models)
RUN mkdir -p /app/models

# Copy the built jar from build stage
COPY --from=build /app/target/nutrition-app-backend-0.0.1-SNAPSHOT.jar app.jar

# Expose port
EXPOSE 8080

# Run the application
# Models will be auto-downloaded if ML_AUTO_DOWNLOAD=true and ML_MODEL_DOWNLOAD_URL is set
# Or use OpenRouter if OPENROUTER_ENABLED=true
# Or use mock implementation as fallback
CMD ["java", "-jar", "app.jar"]
