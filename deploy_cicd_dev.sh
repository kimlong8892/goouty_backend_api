#!/bin/bash
# CI/CD Deployment script for Dev (Optimized for uptime)
set -e

echo "Building Backend Dev..."
docker compose \
  -p goouty-api-dev \
  -f docker-compose.dev.yml \
  --env-file .env.dev \
  run --rm app sh -c "npm install && npx prisma generate"

echo "Updating Backend Dev container..."
docker compose \
  -p goouty-api-dev \
  -f docker-compose.dev.yml \
  --env-file .env.dev \
  up -d --build
