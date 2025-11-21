# 🚀 Render Deployment Guide

This guide will help you deploy the Order Execution Engine to Render using the Blueprint feature (Infrastructure as Code).

## 📋 Prerequisites

1. **GitHub Account** - Your code must be in a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com) (free)
3. **Solana Wallet** - Generate a keypair for devnet transactions

---

## 🎯 Quick Deploy (Recommended)

### Option 1: Deploy via Render Blueprint

1. **Push to GitHub** (if not already done)
   ```bash
   git add .
   git commit -m "Add Render deployment configuration"
   git push origin main
   ```

2. **Deploy to Render**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click **"New"** → **"Blueprint"**
   - Connect your GitHub repository
   - Select the repository: `17kaushalsingh/backend-task-eterna-labs`
   - Render will automatically detect `render.yaml`
   - Click **"Apply"**

3. **Configure Environment Variables**
   - After deployment starts, go to the web service settings
   - Add the `PRIVATE_KEY` environment variable:
     - Key: `PRIVATE_KEY`
     - Value: Your Solana keypair as JSON array (e.g., `[1,2,3,...]`)
   - Save and redeploy

4. **Wait for Deployment**
   - PostgreSQL database: ~2-3 minutes
   - Redis: ~1-2 minutes
   - Web service: ~5-7 minutes
   - Total: ~10 minutes

5. **Access Your Application**
   - Render will provide a URL like: `https://order-execution-engine.onrender.com`
   - Open the URL to see your dashboard

---

## 📦 What Gets Deployed

The `render.yaml` blueprint creates:

### 1. **PostgreSQL Database** (Free Tier)
- **Name:** `order-engine-db`
- **Plan:** Free (256 MB RAM, 1 GB storage)
- **Region:** Oregon
- **Features:**
  - Automatic backups (7 days retention)
  - SSL connections
  - Persistent storage

### 2. **Redis Cache** (Free Tier)
- **Name:** `order-engine-redis`
- **Plan:** Free (25 MB)
- **Region:** Oregon
- **Features:**
  - In-memory caching
  - Pub/Sub for WebSocket updates
  - Queue management for BullMQ

### 3. **Web Service** (Free Tier)
- **Name:** `order-execution-engine`
- **Plan:** Free (512 MB RAM, 0.1 CPU)
- **Region:** Oregon
- **Features:**
  - Runs both API server and worker
  - Auto-deploy on git push
  - Health checks
  - HTTPS enabled
  - Custom domain support

---

## 🔧 Manual Deployment (Alternative)

If you prefer manual setup:

### Step 1: Create PostgreSQL Database
1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Name: `order-engine-db`
3. Database: `order_engine`
4. User: `orderengine`
5. Region: Oregon
6. Plan: Free
7. Click **Create Database**
8. Copy the **Internal Database URL**

### Step 2: Create Redis Instance
1. Go to Render Dashboard → **New** → **Redis**
2. Name: `order-engine-redis`
3. Region: Oregon (same as database)
4. Plan: Free
5. Click **Create Redis**
6. Copy the **Internal Redis URL**

### Step 3: Create Web Service
1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Name:** `order-execution-engine`
   - **Region:** Oregon
   - **Branch:** main
   - **Runtime:** Node
   - **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command:** `npx prisma migrate deploy && npm start`
   - **Plan:** Free

4. Add Environment Variables:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<paste Internal Database URL>
   REDIS_HOST=<paste Redis hostname>
   REDIS_PORT=<paste Redis port>
   SOLANA_RPC_URL=https://api.devnet.solana.com
   PRIVATE_KEY=<your Solana keypair JSON array>
   ```

5. Click **Create Web Service**

---

## 🔑 Getting Your Solana Private Key

### Generate New Keypair (Recommended for Testing)
```bash
# Install Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Generate new keypair
solana-keygen new --outfile ~/my-keypair.json

# Get the keypair as JSON array
cat ~/my-keypair.json
```

### Use Existing Keypair
If you have an existing keypair, convert it to JSON array format:
```bash
cat ~/.config/solana/id.json
```

Copy the entire array (e.g., `[1,2,3,4,...]`) and paste it as the `PRIVATE_KEY` environment variable.

### Get Devnet SOL
```bash
# Airdrop devnet SOL
solana airdrop 2 <your-public-key> --url devnet
```

---

## ⚙️ Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port (Render uses 10000) | `10000` |
| `DATABASE_URL` | PostgreSQL connection string | Auto-filled by Render |
| `REDIS_HOST` | Redis hostname | Auto-filled by Render |
| `REDIS_PORT` | Redis port | Auto-filled by Render |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `PRIVATE_KEY` | Solana keypair (JSON array) | `[1,2,3,...]` |

---

## 🧪 Testing Your Deployment

### 1. Check Service Health
```bash
curl https://your-app.onrender.com/
```
Should return the HTML dashboard.

### 2. Submit Test Order
```bash
curl -X POST https://your-app.onrender.com/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"SOL","outputToken":"USDC","amount":0.1}'
```

### 3. Open Dashboard
Visit: `https://your-app.onrender.com`

### 4. Check Logs
- Go to Render Dashboard
- Click on your web service
- Click **"Logs"** tab
- Watch for:
  - `Server listening on 10000`
  - `Worker is ready and connected to Redis`

---

## 🚨 Important Notes

### Free Tier Limitations
- **Web Service:** Spins down after 15 minutes of inactivity
- **First Request:** May take 30-60 seconds to wake up
- **Database:** 90 days of inactivity = deletion
- **Redis:** 25 MB storage limit
- **Bandwidth:** 100 GB/month

### Keeping Service Active
To prevent spin-down, use a service like [UptimeRobot](https://uptimerobot.com):
1. Create free account
2. Add monitor for your Render URL
3. Set check interval to 5 minutes

### Database Migrations
Migrations run automatically on deployment via:
```bash
npx prisma migrate deploy
```

### Monitoring
- **Logs:** Render Dashboard → Your Service → Logs
- **Metrics:** Render Dashboard → Your Service → Metrics
- **Database:** Render Dashboard → Your Database → Metrics

---

## 🔄 Updating Your Deployment

### Automatic Deployment
Every push to `main` branch triggers automatic deployment:
```bash
git add .
git commit -m "Update feature"
git push origin main
```

### Manual Deployment
1. Go to Render Dashboard
2. Click on your service
3. Click **"Manual Deploy"** → **"Deploy latest commit"**

### Rollback
1. Go to Render Dashboard
2. Click on your service
3. Click **"Events"** tab
4. Find previous successful deployment
5. Click **"Rollback"**

---

## 🐛 Troubleshooting

### Service Won't Start
**Check logs for:**
- Database connection errors → Verify `DATABASE_URL`
- Redis connection errors → Verify `REDIS_HOST` and `REDIS_PORT`
- Missing environment variables → Add in Render Dashboard

### Database Migration Fails
```bash
# SSH into your service (if needed)
# Or run migration manually via Render Shell
npx prisma migrate deploy
```

### Worker Not Processing Orders
**Check:**
1. Logs show: `Worker is ready and connected to Redis`
2. Redis is running and accessible
3. Environment variables are correct

### WebSocket Connection Fails
**Ensure:**
1. HTTPS is enabled (Render does this automatically)
2. WebSocket URL uses `wss://` protocol
3. No firewall blocking WebSocket connections

---

## 📊 Cost Breakdown (Free Tier)

| Service | Plan | Cost |
|---------|------|------|
| PostgreSQL | Free | $0/month |
| Redis | Free | $0/month |
| Web Service | Free | $0/month |
| **Total** | | **$0/month** |

### Upgrade Options (If Needed)
- **PostgreSQL Starter:** $7/month (256 MB → 1 GB RAM)
- **Redis Starter:** $10/month (25 MB → 100 MB)
- **Web Service Starter:** $7/month (Always on, 512 MB RAM)

---

## ✅ Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] `render.yaml` in repository root
- [ ] Render account created
- [ ] Blueprint deployed
- [ ] PostgreSQL database created
- [ ] Redis instance created
- [ ] Web service deployed
- [ ] `PRIVATE_KEY` environment variable added
- [ ] Solana devnet SOL airdropped
- [ ] Service health checked
- [ ] Test order submitted
- [ ] Dashboard accessible
- [ ] Logs verified

---

## 🎉 Success!

Your Order Execution Engine is now live on Render!

**Dashboard URL:** `https://order-execution-engine.onrender.com`

**Next Steps:**
1. Test all features through the dashboard
2. Submit concurrent orders
3. Monitor logs and metrics
4. Share the URL for demo
5. (Optional) Set up custom domain

---

## 📚 Additional Resources

- [Render Documentation](https://render.com/docs)
- [Render Blueprints Guide](https://render.com/docs/infrastructure-as-code)
- [PostgreSQL on Render](https://render.com/docs/databases)
- [Redis on Render](https://render.com/docs/redis)
- [Environment Variables](https://render.com/docs/environment-variables)
- [Custom Domains](https://render.com/docs/custom-domains)

---

## 🆘 Support

If you encounter issues:
1. Check Render Dashboard logs
2. Review this guide
3. Check [Render Community](https://community.render.com)
4. Contact Render Support (support@render.com)

**Happy Deploying!** 🚀
