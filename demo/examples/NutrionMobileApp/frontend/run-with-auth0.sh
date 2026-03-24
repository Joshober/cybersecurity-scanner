#!/bin/bash
# Bash script to run Flutter app with Auth0 configuration from .env file
# Reads Auth0 values from root .env file and passes them as --dart-define arguments

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/.env"

# Default values
AUTH0_DOMAIN=""
AUTH0_CLIENT_ID=""
AUTH0_AUDIENCE=""

# Read .env file if it exists
if [ -f "$ENV_FILE" ]; then
    echo "Reading Auth0 config from .env file..."
    
    while IFS='=' read -r key value; do
        # Skip comments and empty lines
        [[ "$key" =~ ^#.*$ ]] && continue
        [[ -z "$key" ]] && continue
        
        # Remove leading/trailing whitespace
        key=$(echo "$key" | xargs)
        value=$(echo "$value" | xargs)
        
        # Remove quotes if present
        value=$(echo "$value" | sed -e 's/^"//' -e 's/"$//' -e "s/^'//" -e "s/'$//")
        
        case "$key" in
            AUTH0_DOMAIN)
                AUTH0_DOMAIN="$value"
                ;;
            AUTH0_CLIENT_ID)
                AUTH0_CLIENT_ID="$value"
                ;;
            AUTH0_AUDIENCE)
                AUTH0_AUDIENCE="$value"
                ;;
        esac
    done < "$ENV_FILE"
    
    echo "  ✓ AUTH0_DOMAIN: $AUTH0_DOMAIN"
    echo "  ✓ AUTH0_CLIENT_ID: $AUTH0_CLIENT_ID"
    echo "  ✓ AUTH0_AUDIENCE: $AUTH0_AUDIENCE"
else
    echo ".env file not found at $ENV_FILE"
    echo "   Create it by copying env.example to .env"
fi

# Check if all Auth0 values are set
if [ -z "$AUTH0_DOMAIN" ] || [ -z "$AUTH0_CLIENT_ID" ] || [ -z "$AUTH0_AUDIENCE" ]; then
    echo ""
    echo "Missing Auth0 configuration!"
    echo "   Please set these in your .env file:"
    echo "   - AUTH0_DOMAIN"
    echo "   - AUTH0_CLIENT_ID"
    echo "   - AUTH0_AUDIENCE"
    echo ""
    echo "   Or run manually with:"
    echo "   flutter run --dart-define=AUTH0_DOMAIN=... --dart-define=AUTH0_CLIENT_ID=... --dart-define=AUTH0_AUDIENCE=..."
    exit 1
fi

# Get device ID if provided as argument
DEVICE_ID="$1"

# Build flutter run command
FLUTTER_CMD="flutter run"

if [ -n "$DEVICE_ID" ]; then
    FLUTTER_CMD="$FLUTTER_CMD -d $DEVICE_ID"
    echo ""
    echo "Running on device: $DEVICE_ID"
else
    echo ""
    echo "Running on default device (use './run-with-auth0.sh <device-id>' to specify)"
fi

# Add --dart-define arguments
FLUTTER_CMD="$FLUTTER_CMD --dart-define=AUTH0_DOMAIN=$AUTH0_DOMAIN"
FLUTTER_CMD="$FLUTTER_CMD --dart-define=AUTH0_CLIENT_ID=$AUTH0_CLIENT_ID"
FLUTTER_CMD="$FLUTTER_CMD --dart-define=AUTH0_AUDIENCE=$AUTH0_AUDIENCE"

echo ""
echo "Starting Flutter app with Auth0 configuration..."
echo ""

# Change to frontend directory and run
cd "$SCRIPT_DIR"
eval "$FLUTTER_CMD"

