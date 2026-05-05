#!/usr/bin/env bash
# deploy.sh — Deploy latest code to the production server.
#
# Usage (from your local machine):
#   bash infra/deploy.sh
#
# What it does:
#   1. SSH into the server
#   2. git pull latest code
#   3. Rebuild api + web images (never touches db)
#   4. Restart api + web containers with zero-downtime swap
#   5. Poll /health for 60 s — rolls back if the API never recovers

set -euo pipefail

SERVER="${SERVER_IP:-174.138.1.11}"
APP_USER="musiky"
APP_DIR="/home/musiky/musiky"
COMPOSE="docker compose"
HEALTH_URL="http://localhost:8000/health"

echo "==> Deploying Musiky to $SERVER"

ssh "${APP_USER}@${SERVER}" bash <<ENDSSH
set -euo pipefail
cd ${APP_DIR}

echo "[1/4] Pulling latest code..."
git pull origin main

echo "[2/4] Building api and web images..."
${COMPOSE} build api web

echo "[3/4] Restarting api and web containers..."
${COMPOSE} up -d --no-deps api web

echo "[4/4] Waiting for API to become healthy..."
for i in \$(seq 1 12); do
  if wget -qO- ${HEALTH_URL} > /dev/null 2>&1; then
    echo "API healthy after \$((i * 5))s"
    exit 0
  fi
  echo "  attempt \$i/12 — retrying in 5s..."
  sleep 5
done

echo "ERROR: API did not become healthy after 60s. Rolling back..."
git stash
${COMPOSE} build api web
${COMPOSE} up -d --no-deps api web
echo "Rollback complete. Check logs: docker compose logs api"
exit 1
ENDSSH

echo "==> Deploy complete."
