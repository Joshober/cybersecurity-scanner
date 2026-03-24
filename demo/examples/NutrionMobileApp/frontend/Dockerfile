# Multi-stage build for Flutter web app
FROM ubuntu:22.04 as build

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    git \
    unzip \
    xz-utils \
    zip \
    libglu1-mesa \
    && rm -rf /var/lib/apt/lists/*

# Install Flutter
RUN git clone https://github.com/flutter/flutter.git /flutter
ENV PATH="/flutter/bin:/flutter/bin/cache/dart-sdk/bin:${PATH}"

# Set up the app
WORKDIR /app
COPY pubspec.yaml pubspec.lock ./
RUN flutter pub get

# Copy the rest of the app
COPY . .

# Enable web support for Flutter
RUN flutter create . --platforms web

# Build the web app with environment variables
# Railway passes environment variables during build
# API_BASE_URL and Auth0 variables should be set as environment variables
# Note: Railway makes environment variables available during Docker build
# Use ARG with default from ENV to support both build args and env vars
ARG API_BASE_URL
ARG AUTH0_DOMAIN
ARG AUTH0_CLIENT_ID
ARG AUTH0_AUDIENCE
ENV API_BASE_URL=${API_BASE_URL}
ENV AUTH0_DOMAIN=${AUTH0_DOMAIN}
ENV AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}
ENV AUTH0_AUDIENCE=${AUTH0_AUDIENCE}

# Build with environment variable support
# Flutter's --dart-define requires the value to be passed at build time
RUN echo "🔨 Building Flutter web app..." && \
    BUILD_ARGS="--release" && \
    if [ -n "${API_BASE_URL}" ]; then \
      BUILD_ARGS="${BUILD_ARGS} --dart-define=API_BASE_URL=${API_BASE_URL}"; \
      echo "  ✓ API_BASE_URL=${API_BASE_URL}"; \
    fi && \
    if [ -n "${AUTH0_DOMAIN}" ]; then \
      BUILD_ARGS="${BUILD_ARGS} --dart-define=AUTH0_DOMAIN=${AUTH0_DOMAIN}"; \
      echo "  ✓ AUTH0_DOMAIN=${AUTH0_DOMAIN}"; \
    fi && \
    if [ -n "${AUTH0_CLIENT_ID}" ]; then \
      BUILD_ARGS="${BUILD_ARGS} --dart-define=AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}"; \
      echo "  ✓ AUTH0_CLIENT_ID=${AUTH0_CLIENT_ID}"; \
    fi && \
    if [ -n "${AUTH0_AUDIENCE}" ]; then \
      BUILD_ARGS="${BUILD_ARGS} --dart-define=AUTH0_AUDIENCE=${AUTH0_AUDIENCE}"; \
      echo "  ✓ AUTH0_AUDIENCE=${AUTH0_AUDIENCE}"; \
    fi && \
    if [ -z "${API_BASE_URL}" ] && [ -z "${AUTH0_DOMAIN}" ] && [ -z "${AUTH0_CLIENT_ID}" ] && [ -z "${AUTH0_AUDIENCE}" ]; then \
      echo "No environment variables set, using defaults from app_config.dart"; \
    fi && \
    echo "Building with: flutter build web ${BUILD_ARGS}" && \
    flutter build web ${BUILD_ARGS}

# Production stage
FROM nginx:alpine

# Copy built web app
COPY --from=build /app/build/web /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 3000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
