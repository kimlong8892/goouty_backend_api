#!/bin/bash
# CI/CD Deployment script for Prod (Optimized for uptime)
set -e

echo "Building Backend Prod..."
docker compose \
  -p goouty-api-prod \
  -f docker-compose.prod.yml \
  --env-file .env.prod \
  run --rm app sh -c "npm install && npx prisma generate && npm run build"

echo "Updating Backend Prod container..."
docker compose \
  -p goouty-api-prod \
  -f docker-compose.prod.yml \
  --env-file .env.prod \
  up -d --build
