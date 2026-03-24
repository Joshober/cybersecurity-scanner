# Deploy to Railway using Docker images via CLI
# This script builds Docker images and deploys them using railway up

param(
    [string]$Service = "all"  # "backend", "frontend", or "all"
)

Write-Host "Railway Docker Deployment Script" -ForegroundColor Cyan
Write-Host ""

# Function to deploy a service
function Deploy-Service {
    param(
        [string]$ServiceName,
        [string]$ServiceDir,
        [string]$RailwayService
    )
    
    Write-Host "Building and deploying $ServiceName..." -ForegroundColor Yellow
    Write-Host ""
    
    # Navigate to service directory
    Push-Location $ServiceDir
    
    try {
        # Build Docker image locally (for testing)
        Write-Host "Building Docker image..." -ForegroundColor Cyan
        docker build -t "$ServiceName:local" .
        
        if ($LASTEXITCODE -ne 0) {
            Write-Host "Docker build failed!" -ForegroundColor Red
            return $false
        }
        
        Write-Host "Docker image built successfully" -ForegroundColor Green
        Write-Host ""
        
        # Deploy using Railway CLI
        Write-Host "Deploying to Railway..." -ForegroundColor Cyan
        railway service $RailwayService
        railway up
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "$ServiceName deployed successfully!" -ForegroundColor Green
            return $true
        } else {
            Write-Host "Railway deployment failed!" -ForegroundColor Red
            return $false
        }
    }
    finally {
        Pop-Location
    }
}

# Check if Docker is running
Write-Host "Checking Docker..." -ForegroundColor Cyan
try {
    docker ps | Out-Null
    Write-Host "Docker is running" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "Docker is not running! Please start Docker Desktop." -ForegroundColor Red
    exit 1
}

# Deploy services
$success = $true

if ($Service -eq "backend" -or $Service -eq "all") {
    $result = Deploy-Service -ServiceName "nutrition-backend" -ServiceDir "backend" -RailwayService "nutrition-backend"
    if (-not $result) { $success = $false }
    Write-Host ""
}

if ($Service -eq "frontend" -or $Service -eq "all") {
    $result = Deploy-Service -ServiceName "nutrition-frontend" -ServiceDir "frontend" -RailwayService "nutrition-frontend"
    if (-not $result) { $success = $false }
    Write-Host ""
}

if ($success) {
    Write-Host "All deployments completed!" -ForegroundColor Green
} else {
    Write-Host "Some deployments failed. Check the logs above." -ForegroundColor Yellow
    exit 1
}

