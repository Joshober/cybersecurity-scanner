# Nutrition App Backend

Spring Boot backend for the Nutrition Mobile App with food recognition, portion estimation, and menu processing.

## Features

- **Food Recognition**: ONNX local models or OpenRouter API
- **Portion Size Estimation**: AI-powered or rule-based
- **Menu Processing**: Sodexo API integration with Lucene search
- **Authentication**: Auth0 or custom JWT
- **Health Monitoring**: Spring Boot Actuator
- **API Documentation**: Swagger/OpenAPI
- **Database Migrations**: Flyway

## Quick Start

### Prerequisites

- Java 17+
- Maven 3.8+
- (Optional) PostgreSQL, Redis

### Development Setup

1. **Clone and navigate**:
   ```bash
   cd backend
   ```

2. **Configure environment** (see `env.example` in project root):
   ```bash
   # Copy env.example to .env and configure
   ```

3. **Run with Maven**:
   ```bash
   mvn spring-boot:run
   ```

4. **Access**:
   - API: http://localhost:8080
   - Swagger UI: http://localhost:8080/swagger-ui.html
   - H2 Console: http://localhost:8080/h2-console
   - Actuator: http://localhost:8080/actuator/health

## Configuration

### Environment Variables

See `env.example` in the project root for all available configuration options.

Key variables:
- `ML_MODE`: `local` (ONNX) or `openrouter-only`
- `ML_AUTO_DOWNLOAD`: Auto-download models if missing
- `OPENROUTER_ENABLED`: Enable OpenRouter API
- `AUTH0_ENABLED`: Enable Auth0 authentication

### ML Recognition Modes

The backend supports two modes for food recognition:

1. **OpenRouter Only** - Cloud-based AI recognition
2. **Local ONNX Model** - Fast, offline inference

See `ML_MODES_GUIDE.md` for complete details.

## Project Structure

```
backend/
├── src/main/java/com/nutrition/
│   ├── config/          # Configuration classes
│   ├── controller/      # REST controllers
│   ├── dto/             # Data transfer objects
│   ├── model/           # Entity models
│   ├── repository/      # Data access layer
│   ├── security/        # Security configuration
│   └── service/         # Business logic
│       ├── OnnxFoodRecognitionService.java
│       ├── OpenRouterService.java
│       └── ModelDownloaderService.java
├── src/main/resources/
│   ├── application.yml  # Main configuration
│   ├── db/migration/    # Flyway migrations
│   └── models/          # ONNX model files (optional)
└── pom.xml              # Maven dependencies
```

## Documentation

- `ML_MODES_GUIDE.md` - ML recognition modes comparison
- `MODEL_AUTO_DOWNLOAD.md` - Auto-download feature
- `OPENROUTER_SETUP.md` - OpenRouter API setup

## API Endpoints

### Food Recognition
- `POST /api/food/recognize` - Recognize food from image

### Health & Info
- `GET /actuator/health` - Health check
- `GET /actuator/info` - Application info
- `GET /swagger-ui.html` - API documentation

## Development

### Running Tests
```bash
mvn test
```

### Building
```bash
mvn clean package
```

### Docker
```bash
docker-compose up backend
```

## Technology Stack

- **Framework**: Spring Boot 3.2.0
- **Language**: Java 17
- **Database**: H2 (dev), PostgreSQL (prod)
- **Cache**: Redis (optional)
- **ML**: ONNX Runtime, OpenRouter API
- **Security**: Spring Security, Auth0, JWT
- **Documentation**: Swagger/OpenAPI
- **Migrations**: Flyway

## License

See project root LICENSE file.
