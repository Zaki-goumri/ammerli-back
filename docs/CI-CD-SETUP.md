# CI/CD Setup Guide

## 📋 Overview

This project uses GitHub Actions for CI/CD with GitHub Container Registry (GHCR) for storing Docker images.

### Architecture

- **Local Development**: Uses `compose.yaml` with `Dockerfile.dev` (builds locally with hot-reload)
- **VPS Production**: Uses `compose.yaml` + `compose.prod.yaml` override (pulls pre-built images from GHCR)

---

## 🔧 Step 1: VPS Initial Setup

### 1.1 Install Docker & Docker Compose on VPS

```bash
# SSH to your VPS
ssh root@api.ammerli.com

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Verify installation
docker --version
docker compose version
```

### 1.2 Create Project Directory

```bash
# Create directory
mkdir -p /root/3ammerli
cd /root/3ammerli

# Clone repository (or copy files)
git clone git@github.com:3ammerli/backend.git .

# Copy your .env file
nano .env  # Add your production environment variables
```

### 1.3 Setup Docker Networks

```bash
# Create networks (if not already exist)
docker network create proxy 2>/dev/null || true
docker network create internal 2>/dev/null || true
```

---

## 🔐 Step 2: Configure GitHub Secrets

Go to your GitHub repository: `https://github.com/3ammerli/backend/settings/secrets/actions`

Add these secrets:

| Secret Name | Value | Description |
|------------|-------|-------------|
| `VPS_HOST` | `api.ammerli.com` | Your VPS hostname |
| `VPS_USER` | `root` | SSH username |
| `VPS_SSH_KEY` | `<private-key>` | SSH private key (see below) |

### 2.1 Generate SSH Key for GitHub Actions

```bash
# On your LOCAL machine
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github-actions-vps

# Copy PUBLIC key to VPS
ssh-copy-id -i ~/.ssh/github-actions-vps.pub root@api.ammerli.com

# Copy PRIVATE key content for GitHub Secret
cat ~/.ssh/github-actions-vps
# Copy the entire output and add to GitHub Secret: VPS_SSH_KEY
```

### 2.2 Test SSH Connection

```bash
# Test from local machine
ssh -i ~/.ssh/github-actions-vps root@api.ammerli.com

# Should connect without password
```

---

## 🚀 Step 3: How It Works

### Workflow Triggers

1. **Push to `main` branch** → Triggers `build-push.yml` → Builds & pushes images to GHCR
2. **After successful build** → Triggers `deploy.yml` → Deploys to VPS automatically
3. **Manual trigger** → You can manually trigger deployment from GitHub Actions tab

### Image Flow

```
[Push to main]
     ↓
[GitHub Actions: Build]
     ↓
├── ghcr.io/3ammerli/backend-base:latest
├── ghcr.io/3ammerli/backend:latest
└── ghcr.io/3ammerli/backend-minio:latest
     ↓
[Images pushed to GHCR]
     ↓
[GitHub Actions: Deploy]
     ↓
[SSH to VPS]
     ↓
[Pull images from GHCR]
     ↓
[Stop old containers]
     ↓
[Start new containers]
     ↓
[Run migrations]
     ↓
[Health check]
     ↓
[✅ Deployment complete]
```

---

## 📦 Step 4: Local Development vs Production

### Local Development

```bash
# Build base image first (one time)
docker build -t 3ammerli-base:latest -f Dockerfile.base .

# Start development environment
docker compose up -d

# Logs
docker compose logs -f server
```

### Production (VPS)

```bash
# Pull latest images from GHCR
docker compose -f compose.yaml -f compose.prod.yaml pull

# Start production
docker compose -f compose.yaml -f compose.prod.yaml up -d

# Logs
docker compose -f compose.yaml -f compose.prod.yaml logs -f server
```

---

## 🔍 Step 5: Verify Setup

### 5.1 Check GitHub Actions

1. Go to `https://github.com/3ammerli/backend/actions`
2. You should see workflows: `Build & Push to GHCR`, `Deploy to VPS`, `CI - Test & Lint`

### 5.2 Check GHCR Packages

1. Go to `https://github.com/orgs/3ammerli/packages`
2. You should see packages after first build:
   - `backend` (production image)
   - `backend-base` (base image)
   - `backend-minio` (minio image)

### 5.3 Make Package Public (Optional but Recommended)

Since your repo is private, packages are private by default. To avoid authentication issues:

1. Go to each package settings
2. Click "Change visibility" → "Public"
3. This allows VPS to pull without complex auth

---

## 🎯 Step 6: First Deployment

### Option A: Automatic (Recommended)

```bash
# Just push to main branch
git add .
git commit -m "Setup CI/CD"
git push origin main

# GitHub Actions will:
# 1. Build images
# 2. Push to GHCR
# 3. Deploy to VPS automatically
```

### Option B: Manual Trigger

1. Go to `https://github.com/3ammerli/backend/actions`
2. Click "Deploy to VPS" workflow
3. Click "Run workflow" → Select `main` branch → "Run workflow"

---

## 🛠️ Step 7: Troubleshooting

### Problem: SSH Connection Failed

```bash
# On VPS, check authorized_keys
cat ~/.ssh/authorized_keys

# Should contain the public key you added
```

### Problem: Permission Denied on GHCR

```bash
# On VPS, login to GHCR manually
echo YOUR_GITHUB_TOKEN | docker login ghcr.io -u YOUR_GITHUB_USERNAME --password-stdin

# Then try pulling
docker pull ghcr.io/3ammerli/backend:latest
```

### Problem: Health Check Failed

```bash
# Check if health endpoint exists
curl http://localhost:3000/health

# Check container logs
docker compose logs server

# Check container status
docker compose ps
```

### Problem: Migration Failed

```bash
# Run migrations manually
docker compose exec server pnpm run migration:run

# Or SSH to VPS and run
cd /root/3ammerli
docker compose -f compose.yaml -f compose.prod.yaml exec server pnpm run migration:run
```

---

## 📝 Step 8: Maintenance Commands

### View Deployment Logs

```bash
# SSH to VPS
ssh root@api.ammerli.com

# View logs
cd /root/3ammerli
docker compose -f compose.yaml -f compose.prod.yaml logs -f
```

### Rollback to Previous Version

```bash
# SSH to VPS
cd /root/3ammerli

# Pull specific version
docker pull ghcr.io/3ammerli/backend:<commit-sha>

# Update compose to use that version, then restart
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

### Clean Up Old Images

```bash
# On VPS
docker image prune -a -f
```

---

## ✅ Checklist

- [ ] Docker installed on VPS
- [ ] Project directory created on VPS (`/root/3ammerli`)
- [ ] `.env` file configured on VPS
- [ ] SSH key generated and added to VPS
- [ ] GitHub Secrets configured (VPS_HOST, VPS_USER, VPS_SSH_KEY)
- [ ] GHCR packages visibility set to public (optional)
- [ ] First deployment successful
- [ ] Health check endpoint working
- [ ] Migrations running successfully

---

## 🎉 You're Done!

Now every push to `main` will automatically build and deploy to your VPS!

Monitor deployments at: `https://github.com/3ammerli/backend/actions`
