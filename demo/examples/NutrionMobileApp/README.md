# Nutrition Mobile App

A comprehensive nutrition tracking mobile application with Flutter frontend, Spring Boot backend, and AI-powered food recognition.

## Features

- **Food Recognition**: AI-powered food identification using ONNX Runtime and OpenRouter
- **Portion Size Estimation**: Automatic portion size detection from photos
- **Nutrition Tracking**: Track calories, macros, and micronutrients
- **Menu Integration**: Connect with dining hall menus
- **User Authentication**: Secure authentication with Auth0
- **RESTful API**: Well-documented REST API with Swagger/OpenAPI

## Architecture

```
┌─────────────┐
│   Flutter   │  Mobile Frontend
│   (Dart)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ Spring Boot │  REST API Backend
│   (Java)    │  - Auth0 Integration
└──────┬──────┘  - ONNX Runtime
       │         - OpenRouter API
       ▼
┌─────────────┐
│ PostgreSQL  │  Database
└─────────────┘
```

## Tech Stack

### Frontend
- **Flutter** 3.0+ with Dart
- **Provider** for state management
- **HTTP** for API communication
- **Camera** for food photography

### Backend
- **Spring Boot** 3.2.0
- **Java** 17
- **PostgreSQL** 15
- **Redis** for caching
- **ONNX Runtime** for local ML inference
- **OpenRouter API** for cloud-based ML
- **Auth0** for authentication
- **Flyway** for database migrations
- **Swagger/OpenAPI** for API documentation

## Prerequisites

- Java 17+
- Maven 3.8+
- Flutter 3.0+
- (Optional) PostgreSQL, Redis, Docker

## Documentation

All documentation is organized in the `docs/` directory:

- **Setup Guides**: `docs/setup/` - Auth0, Food Model, Environment setup
- **Feature Guides**: `docs/guides/` - ML modes, deployment, development
- **API Docs**: Available at `http://localhost:8080/swagger-ui.html` when backend is running

See `docs/README.md` for complete documentation index.

## Quick Start

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/nutrition-mobile-app.git
cd nutrition-mobile-app
```

### 2. Backend Setup

```bash
cd backend

# Copy environment variables
cp ../.env.example .env
# Edit .env with your configuration

# Run with Maven
mvn spring-boot:run

# Or with Docker
docker-compose up backend
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
flutter pub get

# Run app
flutter run
```

## Authentication Setup

### Option 1: Auth0 (Recommended)

1. Create account at [auth0.com](https://auth0.com)
2. Create Application → Regular Web Application
3. Create API → Note the identifier
4. Add to `.env`:
   ```bash
   AUTH0_ENABLED=true
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_AUDIENCE=https://your-api-identifier
   ```

### Option 2: Custom JWT (Fallback)

If Auth0 is not configured, the app uses custom JWT:
```bash
JWT_SECRET=your-secret-key-min-32-characters
```

## API Documentation

Once the backend is running, visit:
- **Swagger UI**: http://localhost:8080/swagger-ui.html
- **OpenAPI JSON**: http://localhost:8080/v3/api-docs

## Docker Deployment

```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

## Deployment

For deployment instructions, see the guides in `docs/guides/`:

- Railway deployment guides
- Multi-platform deployment options
- General deployment instructions

Quick deploy options include Railway, Render, and Fly.io.

## Monitoring

- **Health Check**: `/actuator/health`
- **Metrics**: `/actuator/metrics`
- **Info**: `/actuator/info`

## Testing

```bash
# Backend tests
cd backend
mvn test

# Frontend tests
cd frontend
flutter test
```

## Project Structure

```
nutrition-mobile-app/
├── frontend/          # Flutter mobile app
├── backend/           # Spring Boot REST API
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/
│   │   │   └── resources/
│   │   │       ├── db/migration/  # Flyway migrations
│   │   │       └── models/        # TensorFlow Lite models
│   │   └── test/
├── docker-compose.yml
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Technical Highlights

- **Enterprise Authentication**: Integrated Auth0 for production-ready security
- **AI/ML Integration**: TensorFlow Lite and OpenRouter for food recognition
- **Microservices Architecture**: Docker containerization, RESTful APIs
- **Database Migrations**: Flyway for version-controlled schema management
- **API Documentation**: Swagger/OpenAPI for professional API docs
- **Production Monitoring**: Spring Boot Actuator for health checks
- **Cloud Deployment**: Deployed to [Railway/Render/etc.]

## Support

For issues and questions, please open an issue on GitHub.

---

Built with Flutter, Spring Boot, and modern DevOps practices
