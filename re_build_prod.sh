docker compose \
  -p goouty-api-prod \
  -f docker-compose.prod.yml \
  --env-file .env.prod \
  down -v

docker compose \
  -p goouty-api-prod \
  -f docker-compose.prod.yml \
  --env-file .env.prod \
  up -d --build