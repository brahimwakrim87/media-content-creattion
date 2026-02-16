#!/bin/bash
set -euo pipefail

# DMCC Production Deploy Script
# Usage: ./scripts/deploy.sh
# Run from: /root/media-content-creattion

cd /root/media-content-creattion

echo "=== DMCC Deploy ==="
echo "[$(date)] Starting deployment..."

# Pull latest code
echo "[1/6] Pulling latest code..."
git pull origin main

# Build containers
echo "[2/6] Building containers..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Start services
echo "[3/6] Starting services..."
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Wait for PHP container to be healthy
echo "[4/6] Waiting for PHP container..."
sleep 10

# Symfony cache + migrations
echo "[5/6] Running Symfony cache and migrations..."
docker compose exec php-fpm php bin/console cache:clear --env=prod --no-debug
docker compose exec php-fpm php bin/console cache:warmup --env=prod --no-debug
docker compose exec php-fpm php bin/console doctrine:migrations:migrate --no-interaction

# Reload nginx (pick up any config changes)
echo "[6/6] Reloading nginx..."
docker compose exec nginx nginx -s reload

echo ""
echo "[$(date)] Deploy complete!"
echo "Services status:"
docker compose ps --format "table {{.Name}}\t{{.Status}}"
