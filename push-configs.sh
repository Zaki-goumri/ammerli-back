#!/bin/bash
# Push configuration files to VPS

set -e

# Load configuration from .env
if [ -f .env ]; then
    export $(grep -v '^#' .env | grep -E '^(VPS_HOST|VPS_PATH|VPS_PASSWORD)=' | xargs)
fi

# Check if required variables are set
if [ -z "$VPS_HOST" ] || [ -z "$VPS_PATH" ]; then
    echo "Error: VPS_HOST and VPS_PATH must be set in .env file"
    echo ""
    echo "Add these to your .env:"
    echo "  VPS_HOST=root@YOUR_VPS_IP"
    echo "  VPS_PATH=/root/ammerli"
    echo "  VPS_PASSWORD=YOUR_PASSWORD  # Optional"
    exit 1
fi

echo "Pushing configuration files to VPS..."
echo "Target: $VPS_HOST:$VPS_PATH"
echo ""

# Check if sshpass is available for password authentication
USE_SSHPASS=false
if [ -n "$VPS_PASSWORD" ]; then
    if command -v sshpass &> /dev/null; then
        USE_SSHPASS=true
        echo "Using password authentication..."
    else
        echo "Warning: VPS_PASSWORD set but sshpass not installed."
        echo "Install with: sudo apt install sshpass (Ubuntu/Debian) or brew install hudochenkov/sshpass/sshpass (macOS)"
        echo "Falling back to SSH key authentication..."
    fi
fi

# Helper functions for SSH/SCP with optional password
run_ssh() {
    if [ "$USE_SSHPASS" = true ]; then
        sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no "$@"
    else
        ssh "$@"
    fi
}

run_scp() {
    if [ "$USE_SSHPASS" = true ]; then
        sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$@"
    else
        scp "$@"
    fi
}

# Create directory if not exists
run_ssh $VPS_HOST "mkdir -p $VPS_PATH/traefik"

# Push files
echo "Uploading compose.yaml..."
run_scp compose.yaml $VPS_HOST:$VPS_PATH/

echo "Uploading Dockerfile.prod..."
run_scp Dockerfile.prod $VPS_HOST:$VPS_PATH/

echo "Uploading .env..."
run_scp .env $VPS_HOST:$VPS_PATH/

echo "Uploading firebase.config.json..."
run_scp firebase.config.json $VPS_HOST:$VPS_PATH/

echo "Uploading traefik configs..."
run_scp traefik/traefik.yml $VPS_HOST:$VPS_PATH/traefik/
run_scp traefik/config.yml $VPS_HOST:$VPS_PATH/traefik/

echo ""
echo "Setting correct permissions..."
run_ssh $VPS_HOST "cd $VPS_PATH && chmod 600 .env && chmod 600 traefik/acme.json && chmod 644 traefik/traefik.yml traefik/config.yml"

echo ""
echo "Configuration files pushed successfully!"
echo ""
echo "Next steps on VPS:"
echo "  cd $VPS_PATH"
echo "  docker compose pull"
echo "  docker compose down && docker compose up -d"
