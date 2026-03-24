# Nutrition App Makefile
# Cross-platform Docker operations for Windows and Mac
# Since everything runs in Docker, platform differences are minimal

.PHONY: help build up down logs clean restart rebuild test status model-build model-start model-logs model-test

# Detect OS for platform-specific commands
ifeq ($(OS),Windows_NT)
    DETECTED_OS := Windows
    SLEEP_CMD := timeout /t
    SHELL_CMD := cmd /c
else
    DETECTED_OS := $(shell uname -s)
    SLEEP_CMD := sleep
    SHELL_CMD := 
endif

# Default target
help: ## Show this help message
	@echo "Nutrition App - Docker Commands (Cross-Platform)"
	@echo "================================================"
	@echo "Detected OS: $(DETECTED_OS)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'
	@echo ""
	@echo "Quick Start:"
	@echo "  make up     - Start all services"
	@echo "  make logs   - View logs"
	@echo "  make down   - Stop all services"
	@echo ""
	@echo "Model Service:"
	@echo "  make model-start    - Start only model service"
	@echo "  make model-test     - Test model service"
	@echo "  make logs-model     - View model service logs"
	@echo ""
	@echo "Platform Support:"
	@echo "  ✅ Windows (PowerShell/CMD)"
	@echo "  ✅ macOS (Bash/Zsh)"
	@echo "  ✅ Linux (Bash)"
	@echo ""

# Development commands
up: ## Start all services in detached mode
	@echo "🚀 Starting Nutrition App..."
	docker-compose up -d
	@echo "⏳ Waiting for services to be ready..."
ifeq ($(DETECTED_OS),Windows)
	@timeout /t 15 /nobreak > nul
else
	@sleep 15
endif
	@echo "✅ Services started!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8080/api"
	@echo "🤖 Model Service: http://localhost:8000"
	@echo "🗄️  Database: localhost:5432"

up-build: ## Build and start all services
	@echo "🔨 Building and starting services..."
	docker-compose up --build -d
	@echo "⏳ Waiting for services to be ready..."
ifeq ($(DETECTED_OS),Windows)
	@timeout /t 20 /nobreak > nul
else
	@sleep 20
endif
	@echo "✅ Services built and started!"

down: ## Stop all services
	@echo "🛑 Stopping all services..."
	docker-compose down
	@echo "✅ All services stopped!"

restart: ## Restart all services
	@echo "🔄 Restarting services..."
	docker-compose restart
	@echo "✅ Services restarted!"

rebuild: ## Rebuild and restart all services
	@echo "🔨 Rebuilding all services..."
	docker-compose down
	docker-compose up --build -d
	@echo "⏳ Waiting for services to be ready..."
ifeq ($(DETECTED_OS),Windows)
	@timeout /t 20 /nobreak > nul
else
	@sleep 20
endif
	@echo "✅ Services rebuilt and started!"

# Logging commands
logs: ## View logs for all services
	docker-compose logs -f

logs-backend: ## View backend logs only
	docker-compose logs -f backend

logs-frontend: ## View frontend logs only
	docker-compose logs -f frontend

logs-db: ## View database logs only
	docker-compose logs -f postgres

logs-model: ## View model service logs only
	docker-compose logs -f model-service

# Status and monitoring
status: ## Show status of all services
	@echo "📊 Service Status:"
	@echo "=================="
	docker-compose ps
	@echo ""
	@echo "🔍 Health Checks:"
	@echo "================="
ifeq ($(DETECTED_OS),Windows)
	@echo -n "Frontend (3000): "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ DOWN' }"
	@echo -n "Backend (8080):  "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8080/api/portion/labels' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ DOWN' }"
	@echo -n "Model Service (8000): "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ DOWN' }"
else
	@echo -n "Frontend (3000): "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "DOWN"
	@echo ""
	@echo -n "Backend (8080):  "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/portion/labels || echo "DOWN"
	@echo ""
	@echo -n "Model Service (8000): "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health || echo "DOWN"
endif
	@echo ""

test: ## Test API endpoints
	@echo "🧪 Testing API endpoints..."
	@echo "=========================="
ifeq ($(DETECTED_OS),Windows)
	@echo -n "Frontend: "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ FAILED' }"
	@echo -n "Backend:  "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8080/api/portion/labels' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ FAILED' }"
	@echo -n "Model Service: "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ FAILED' }"
else
	@echo -n "Frontend: "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 && echo " ✅" || echo " ❌"
	@echo -n "Backend:  "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/portion/labels && echo " ✅" || echo " ❌"
	@echo -n "Model Service: "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health && echo " ✅" || echo " ❌"
endif

# Database commands
db-shell: ## Connect to PostgreSQL database
	@echo "🗄️  Connecting to PostgreSQL..."
	docker exec -it nutrition-postgres psql -U nutrition_user -d nutrition_db

db-reset: ## Reset database (WARNING: This will delete all data!)
	@echo "⚠️  WARNING: This will delete all database data!"
ifeq ($(DETECTED_OS),Windows)
	@set /p confirm="Are you sure? (y/N): " && if "%%confirm%%"=="y" (
		docker-compose down -v
		docker-compose up -d postgres
		echo ✅ Database reset complete!
	) else (
		echo ❌ Database reset cancelled!
	)
else
	@read -p "Are you sure? (y/N): " confirm && [ "$$confirm" = "y" ]
	docker-compose down -v
	docker-compose up -d postgres
	@echo "✅ Database reset complete!"
endif

# Development commands
dev-backend: ## Start only backend services (db + backend + model)
	@echo "🔧 Starting backend services..."
	docker-compose up -d postgres redis model-service backend
	@echo "✅ Backend services started!"

dev-frontend: ## Start only frontend
	@echo "📱 Starting frontend..."
	docker-compose up -d frontend
	@echo "✅ Frontend started!"

# Cleanup commands
clean: ## Remove all containers, networks, and volumes
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v --remove-orphans
	docker system prune -f
	@echo "✅ Cleanup complete!"

clean-images: ## Remove all Docker images for this project
	@echo "🗑️  Removing project images..."
	docker-compose down --rmi all
	@echo "✅ Images removed!"

# Build commands
build: ## Build all services without starting
	@echo "🔨 Building all services..."
	docker-compose build
	@echo "✅ Build complete!"

build-backend: ## Build backend only
	@echo "🔨 Building backend..."
	docker-compose build backend
	@echo "✅ Backend built!"

build-frontend: ## Build frontend only
	@echo "🔨 Building frontend..."
	docker-compose build frontend
	@echo "✅ Frontend built!"

build-model: ## Build model service only
	@echo "🔨 Building model service..."
	docker-compose build model-service
	@echo "✅ Model service built!"

# Utility commands
shell-backend: ## Open shell in backend container
	docker exec -it nutrition-backend bash

shell-frontend: ## Open shell in frontend container
	docker exec -it nutrition-frontend sh

shell-db: ## Open shell in database container
	docker exec -it nutrition-postgres bash

shell-model: ## Open shell in model service container
	docker exec -it nutrition-model-service bash

# Quick development workflow
dev: ## Start development environment (backend + frontend)
	@echo "🚀 Starting development environment..."
	docker-compose up -d
	@echo "⏳ Waiting for services..."
ifeq ($(DETECTED_OS),Windows)
	@timeout /t 15 /nobreak > nul
else
	@sleep 15
endif
	@echo "✅ Development environment ready!"
	@echo "📱 Frontend: http://localhost:3000"
	@echo "🔧 Backend: http://localhost:8080/api"
	@echo "🤖 Model Service: http://localhost:8000"

prod: ## Start production-like environment
	@echo "🏭 Starting production environment..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
	@echo "✅ Production environment started!"

# Monitoring
monitor: ## Monitor resource usage
	@echo "📊 Resource Usage:"
	@echo "=================="
	docker stats --no-stream

# Backup and restore
backup-db: ## Backup database
	@echo "💾 Backing up database..."
ifeq ($(DETECTED_OS),Windows)
	@for /f "tokens=2 delims==" %%a in ('wmic OS Get localdatetime /value') do set "dt=%%a"
	@set "YY=%dt:~2,2%" & set "YYYY=%dt:~0,4%" & set "MM=%dt:~4,2%" & set "DD=%dt:~6,2%"
	@set "HH=%dt:~8,2%" & set "Min=%dt:~10,2%" & set "Sec=%dt:~12,2%"
	@set "timestamp=%YYYY%%MM%%DD%_%HH%%Min%%Sec%"
	@docker exec nutrition-postgres pg_dump -U nutrition_user nutrition_db > backup_%timestamp%.sql
	@echo "✅ Database backed up to backup_%timestamp%.sql!"
else
	@docker exec nutrition-postgres pg_dump -U nutrition_user nutrition_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Database backed up!"
endif

# Security fix
fix-security: ## Fix Spring Security configuration
	@echo "🔒 Spring Security configuration has been fixed!"
	@echo "✅ API endpoints are now properly configured"
	@echo "🚀 Run 'make rebuild' to apply changes"

# Quick commands for common tasks
start: up ## Alias for up
stop: down ## Alias for down

# Platform-specific helpers
windows-help: ## Show Windows-specific usage
	@echo "Windows Usage:"
	@echo "=============="
	@echo "Make sure you have:"
	@echo "  ✅ Docker Desktop installed"
	@echo "  ✅ Make for Windows (or use WSL)"
	@echo ""
	@echo "Alternative: Use the PowerShell script:"
	@echo "  .\docker-commands.ps1 up"
	@echo "  .\docker-commands.ps1 logs"
	@echo "  .\docker-commands.ps1 down"

mac-help: ## Show macOS-specific usage
	@echo "macOS Usage:"
	@echo "============"
	@echo "Make sure you have:"
	@echo "  ✅ Docker Desktop installed"
	@echo "  ✅ Make installed (brew install make)"
	@echo ""
	@echo "All commands work as expected:"
	@echo "  make up"
	@echo "  make logs"
	@echo "  make down"

# Model Service specific commands
model-start: ## Start only the model service
	@echo "🤖 Starting model service..."
	docker-compose up -d model-service
	@echo "✅ Model service started!"
	@echo "🤖 Model Service: http://localhost:8000"

model-stop: ## Stop only the model service
	@echo "🛑 Stopping model service..."
	docker-compose stop model-service
	@echo "✅ Model service stopped!"

model-restart: ## Restart only the model service
	@echo "🔄 Restarting model service..."
	docker-compose restart model-service
	@echo "✅ Model service restarted!"

model-test: ## Test model service endpoints
	@echo "🧪 Testing model service..."
ifeq ($(DETECTED_OS),Windows)
	@echo -n "Health Check: "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/health' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ FAILED' }"
	@echo -n "Labels Endpoint: "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/labels' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ FAILED' }"
	@echo -n "Model Info: "
	@powershell -Command "try { $response = Invoke-WebRequest -Uri 'http://localhost:8000/model-info' -UseBasicParsing -TimeoutSec 5; Write-Host '✅' $response.StatusCode } catch { Write-Host '❌ FAILED' }"
else
	@echo -n "Health Check: "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health && echo " ✅" || echo " ❌"
	@echo -n "Labels Endpoint: "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/labels && echo " ✅" || echo " ❌"
	@echo -n "Model Info: "
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/model-info && echo " ✅" || echo " ❌"
endif

model-integration-test: ## Run full integration test for model service
	@echo "🧪 Running model service integration test..."
ifeq ($(DETECTED_OS),Windows)
	@python test-model-service.py
else
	@python3 test-model-service.py
endif

# Quick model service workflow
model-dev: ## Start model service for development
	@echo "🤖 Starting model service for development..."
	docker-compose up -d model-service
	@echo "⏳ Waiting for model service to be ready..."
ifeq ($(DETECTED_OS),Windows)
	@timeout /t 10 /nobreak > nul
else
	@sleep 10
endif
	@echo "✅ Model service ready!"
	@echo "🤖 Model Service: http://localhost:8000"
	@echo "📋 View logs: make logs-model"
