#!/bin/bash
# Build script for Railway deployment
# This script handles Flutter web build with environment variables

set -e

echo "Starting Flutter web build..."

# Check if API_BASE_URL is set
if [ -n "$API_BASE_URL" ]; then
    echo "Building with API_BASE_URL: $API_BASE_URL"
    flutter build web --release --dart-define=API_BASE_URL="$API_BASE_URL"
else
    echo "API_BASE_URL not set, using defaults from app_config.dart"
    flutter build web --release
fi

echo "Build complete!"

