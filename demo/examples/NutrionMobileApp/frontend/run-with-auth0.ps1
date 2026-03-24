# PowerShell script to run Flutter app with Auth0 configuration from .env file
# Reads Auth0 values from root .env file and passes them as --dart-define arguments

$projectRoot = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $projectRoot ".env"

# Default values
$auth0Domain = ""
$auth0ClientId = ""
$auth0Audience = ""

# Read .env file if it exists
if (Test-Path $envFile) {
    Write-Host "Reading Auth0 config from .env file..." -ForegroundColor Cyan
    
    $lines = Get-Content $envFile
    foreach ($line in $lines) {
        $line = $line.Trim()
        # Skip comments and empty lines
        if ($line -eq "" -or $line.StartsWith("#")) { continue }
        
        if ($line.StartsWith("AUTH0_DOMAIN=")) {
            $auth0Domain = $line.Substring("AUTH0_DOMAIN=".Length).Trim()
            $auth0Domain = $auth0Domain.Trim('"', "'")
        }
        elseif ($line.StartsWith("AUTH0_CLIENT_ID=")) {
            $auth0ClientId = $line.Substring("AUTH0_CLIENT_ID=".Length).Trim()
            $auth0ClientId = $auth0ClientId.Trim('"', "'")
        }
        elseif ($line.StartsWith("AUTH0_AUDIENCE=")) {
            $auth0Audience = $line.Substring("AUTH0_AUDIENCE=".Length).Trim()
            $auth0Audience = $auth0Audience.Trim('"', "'")
        }
    }
    
    Write-Host "  AUTH0_DOMAIN: $auth0Domain" -ForegroundColor Gray
    Write-Host "  AUTH0_CLIENT_ID: $auth0ClientId" -ForegroundColor Gray
    Write-Host "  AUTH0_AUDIENCE: $auth0Audience" -ForegroundColor Gray
} else {
    Write-Host ".env file not found at $envFile" -ForegroundColor Yellow
    Write-Host "   Create it by copying env.example to .env" -ForegroundColor Yellow
}

# Check if all Auth0 values are set
if ([string]::IsNullOrEmpty($auth0Domain) -or 
    [string]::IsNullOrEmpty($auth0ClientId) -or 
    [string]::IsNullOrEmpty($auth0Audience)) {
    Write-Host ""
    Write-Host "Missing Auth0 configuration!" -ForegroundColor Red
    Write-Host "   Please set these in your .env file:" -ForegroundColor Yellow
    Write-Host "   - AUTH0_DOMAIN" -ForegroundColor Yellow
    Write-Host "   - AUTH0_CLIENT_ID" -ForegroundColor Yellow
    Write-Host "   - AUTH0_AUDIENCE" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   Or run manually with:" -ForegroundColor Cyan
    Write-Host "   flutter run --dart-define=AUTH0_DOMAIN=... --dart-define=AUTH0_CLIENT_ID=... --dart-define=AUTH0_AUDIENCE=..." -ForegroundColor Cyan
    exit 1
}

# Get device ID if provided as argument, otherwise let Flutter choose
$deviceId = $args[0]

# Build flutter run command
$flutterCmd = "flutter run"

if ($deviceId) {
    $flutterCmd += " -d $deviceId"
    Write-Host ""
    Write-Host "Running on device: $deviceId" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "Running on default device (use '.\run-with-auth0.ps1 <device-id>' to specify)" -ForegroundColor Cyan
}

# Add --dart-define arguments
$flutterCmd += " --dart-define=AUTH0_DOMAIN=$auth0Domain"
$flutterCmd += " --dart-define=AUTH0_CLIENT_ID=$auth0ClientId"
$flutterCmd += " --dart-define=AUTH0_AUDIENCE=$auth0Audience"

Write-Host ""
Write-Host "Starting Flutter app with Auth0 configuration..." -ForegroundColor Green
Write-Host ""

# Change to frontend directory and run
Push-Location $PSScriptRoot
try {
    Invoke-Expression $flutterCmd
} finally {
    Pop-Location
}
