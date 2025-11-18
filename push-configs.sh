#!/bin/bash
# Push configuration files to VPS

set -e

# Configuration
VPS_HOST="${VPS_HOST:-root@YOUR_VPS_IP}"
VPS_PATH="/root/ammerli"

echo "Pushing configuration files to VPS..."
echo "Target: $VPS_HOST:$VPS_PATH"
echo ""

# Create directory if not exists
ssh $VPS_HOST "mkdir -p $VPS_PATH/traefik"

# Push files
echo "Uploading compose.yaml..."
scp compose.yaml $VPS_HOST:$VPS_PATH/

echo "Uploading Dockerfile.prod..."
scp Dockerfile.prod $VPS_HOST:$VPS_PATH/

echo "Uploading .env..."
scp .env $VPS_HOST:$VPS_PATH/

echo "Uploading firebase.config.json..."
scp firebase.config.json $VPS_HOST:$VPS_PATH/

echo "Uploading traefik configs..."
scp traefik/traefik.yml $VPS_HOST:$VPS_PATH/traefik/
scp traefik/config.yml $VPS_HOST:$VPS_PATH/traefik/

echo ""
echo "Setting correct permissions..."
ssh $VPS_HOST "cd $VPS_PATH && chmod 600 .env && chmod 600 traefik/acme.json && chmod 644 traefik/traefik.yml traefik/config.yml"

echo ""
echo "Configuration files pushed successfully!"
echo ""
echo "Next steps on VPS:"
echo "  cd $VPS_PATH"
echo "  docker compose pull"
echo "  docker compose down && docker compose up -d"
