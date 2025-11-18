# ✅ CI/CD Setup Complete!

## 📦 What Was Done

### 1. GitHub Actions Workflows Created
- ✅ `.github/workflows/build-push.yml` - Builds & pushes images to GHCR
- ✅ `.github/workflows/deploy.yml` - Deploys to VPS automatically  
- ✅ `.github/workflows/ci.yml` - Lints & tests on PRs

### 2. Docker Configuration Updated
- ✅ `Dockerfile.dev` - Development with hot-reload
- ✅ `Dockerfile.prod` - Production optimized build
- ✅ `compose.yaml` - Base config (local dev)
- ✅ `compose.prod.yaml` - Production override (pulls from GHCR)

### 3. Documentation Added
- ✅ `docs/CI-CD-SETUP.md` - Complete setup guide
- ✅ `README.CI-CD.md` - Quick reference

---

## 🎯 Next Steps (DO THESE NOW!)

### Step 1: Add GitHub Secrets

Go to: `https://github.com/3ammerli/backend/settings/secrets/actions`

Add these 3 secrets:

```
VPS_HOST = api.ammerli.com
VPS_USER = root
VPS_SSH_KEY = <your-private-ssh-key>
```

**How to get SSH key:**

```bash
# On your local machine
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/vps-deploy-key

# Add public key to VPS
ssh-copy-id -i ~/.ssh/vps-deploy-key.pub root@api.ammerli.com

# Copy private key for GitHub Secret
cat ~/.ssh/vps-deploy-key
# Copy entire output → Add to GitHub Secret: VPS_SSH_KEY
```

---

### Step 2: Setup VPS

SSH to your VPS and run:

```bash
# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Create project directory
mkdir -p /root/3ammerli
cd /root/3ammerli

# Clone repository
git clone git@github.com:3ammerli/backend.git .

# Copy/create .env file
nano .env
# Add all your production environment variables

# Create networks
docker network create proxy 2>/dev/null || true
docker network create internal 2>/dev/null || true
```

---

### Step 3: Test Deployment

#### Option A: Automatic (Push to main)

```bash
# Commit and push these changes
git add .
git commit -m "feat: setup CI/CD with GHCR"
git push origin main

# Watch GitHub Actions
# Go to: https://github.com/3ammerli/backend/actions
```

#### Option B: Manual Test

1. Go to `https://github.com/3ammerli/backend/actions`
2. Click "Build & Push to GHCR" workflow
3. Click "Run workflow" → Run
4. After success, click "Deploy to VPS" workflow  
5. Click "Run workflow" → Run

---

### Step 4: Make GHCR Packages Public (Optional)

If deployment fails with authentication issues:

1. Go to `https://github.com/orgs/3ammerli/packages`
2. Click each package (backend, backend-base, backend-minio)
3. Click "Package settings"
4. Change visibility to "Public"

This allows VPS to pull without complex authentication.

---

## 🔍 Verification Checklist

After deployment completes, verify:

```bash
# SSH to VPS
ssh root@api.ammerli.com
cd /root/3ammerli

# Check containers are running
docker compose -f compose.yaml -f compose.prod.yaml ps

# Check logs
docker compose -f compose.yaml -f compose.prod.yaml logs -f server

# Test health endpoint
curl http://localhost:3000/health

# Test API endpoint
curl https://api.ammerli.com/health
```

Expected response: `{"status":"ok"}` or similar

---

## 📊 How It Works Now

```
[Push to main]
     ↓
[GitHub Actions: Lint & Build Check]
     ↓
[GitHub Actions: Build Images]
     ↓
├── ghcr.io/3ammerli/backend-base:latest
├── ghcr.io/3ammerli/backend:latest  
└── ghcr.io/3ammerli/backend-minio:latest
     ↓
[Push to GHCR]
     ↓
[GitHub Actions: Deploy]
     ↓
[SSH to VPS]
     ↓
[Pull new images]
     ↓
[Stop old containers (30s graceful)]
     ↓
[Start new containers]
     ↓
[Run migrations]
     ↓
[Health check (12 retries)]
     ↓
[✅ Deploy Success] or [❌ Auto-rollback]
```

---

## 🛠️ Daily Usage

### For Development (Local)

```bash
# Start
docker compose up -d

# Logs  
docker compose logs -f server

# Restart after code change (hot-reload enabled)
# Just save files, no restart needed!
```

### For Production (Automatic)

```bash
# Just push!
git push origin main

# That's it! GitHub Actions handles everything
```

### For Production (Manual Deploy)

```bash
# SSH to VPS
ssh root@api.ammerli.com
cd /root/3ammerli

# Pull & restart
docker compose -f compose.yaml -f compose.prod.yaml pull
docker compose -f compose.yaml -f compose.prod.yaml up -d
```

---

## ⚠️ Important Notes

1. **First deployment**: Build takes 5-10 minutes (builds all images)
2. **Subsequent deploys**: 2-3 minutes (uses cached layers)
3. **Downtime**: ~30 seconds during container restart
4. **Rollback**: Automatic if health check fails
5. **Database**: Migrations run automatically, rollback if they fail

---

## 🎉 You're All Set!

Once you complete the 4 steps above, your CI/CD is fully automated!

**Questions?** Check the detailed guide: `docs/CI-CD-SETUP.md`

**Issues?** See troubleshooting section in the guide.
