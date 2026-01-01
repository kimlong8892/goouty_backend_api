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

echo "Checking Cloudflare Tunnel status..."
if [ "$(docker ps -q -f name=cloudflared_prod)" ]; then
    echo "Cloudflare Tunnel container is running."
    # Check logs for "Connected" or "Healthy"
    if docker logs cloudflared_prod 2>&1 | grep -q "Infrastructure successfully registered"; then
        echo "Cloudflare Tunnel is connected and registered."
    else
        echo "Cloudflare Tunnel is starting or has connection issues. Check logs: docker logs cloudflared_prod"
    fi
else
    echo "Cloudflare Tunnel failed to start. Please check your token and configuration."
fi

