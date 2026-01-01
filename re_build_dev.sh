docker compose \
  -p goouty-api-dev \
  -f docker-compose.dev.yml \
  --env-file .env.dev \
  down -v

docker compose \
  -p goouty-api-dev \
  -f docker-compose.dev.yml \
  --env-file .env.dev \
  up -d --build