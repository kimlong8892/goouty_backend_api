docker compose \
  -p goouty-api-local \
  -f docker-compose.local.yml \
  --env-file .env.local \
  down -v

docker compose \
  -p goouty-api-local \
  -f docker-compose.local.yml \
  --env-file .env.local \
  up -d --build