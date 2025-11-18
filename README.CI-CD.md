# Quick Start: CI/CD

## Local Development
```bash
# Build base image (one time)
docker build -t 3ammerli-base:latest -f Dockerfile.base .

# Start dev environment
docker compose up -d
```

## Production Deployment

### Automatic (Push to main)
```bash
git push origin main
# GitHub Actions will build & deploy automatically
```

### Manual Trigger
1. Go to GitHub Actions tab
2. Run "Deploy to VPS" workflow

## Production Commands (VPS)
```bash
# Pull & restart
cd /root/3ammerli
docker compose -f compose.yaml -f compose.prod.yaml pull
docker compose -f compose.yaml -f compose.prod.yaml up -d

# View logs
docker compose -f compose.yaml -f compose.prod.yaml logs -f

# Run migrations
docker compose -f compose.yaml -f compose.prod.yaml exec server pnpm run migration:run
```

## Required Secrets
Add these to GitHub Secrets:
- `VPS_HOST`: api.ammerli.com
- `VPS_USER`: root
- `VPS_SSH_KEY`: Private SSH key

For detailed setup, see [CI-CD-SETUP.md](./docs/CI-CD-SETUP.md)
