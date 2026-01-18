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

echo "Checking Cloudflare Tunnel status..."
if [ "$(docker ps -q -f name=cloudflared_dev)" ]; then
    echo "Cloudflare Tunnel container is running."
    # Check logs for "Connected" or "Healthy"
    if docker logs cloudflared_dev 2>&1 | grep -q "Infrastructure successfully registered"; then
        echo "Cloudflare Tunnel is connected and registered."
    else
        echo "Cloudflare Tunnel is starting or has connection issues. Check logs: docker logs cloudflared_dev"
    fi
else
    echo "Cloudflare Tunnel failed to start. Please check your token and configuration."
fi

