# 🚀 Quick Start Guide - Order Execution Engine

## 📋 Codebase Overview

### Core Architecture
```
be/
├── src/
│   ├── api/
│   │   └── server.ts          # Fastify API + WebSocket server
│   ├── worker/
│   │   ├── orderProcessor.ts  # BullMQ worker - processes orders
│   │   └── start.ts           # Worker entry point
│   ├── dex/
│   │   ├── router.ts          # Smart routing logic
│   │   ├── raydium.ts         # Raydium DEX adapter
│   │   └── meteora.ts         # Meteora DEX adapter
│   ├── queue/
│   │   └── orderQueue.ts      # BullMQ queue configuration
│   └── utils/
│       ├── redis.ts           # Redis pub/sub clients
│       └── solana.ts          # Solana connection & wallet
├── prisma/
│   └── schema.prisma          # PostgreSQL database schema
├── public/
│   └── index.html             # Web UI for testing
├── scripts/
│   ├── check-orders.ts        # View order status in DB
│   ├── test-execution.ts      # E2E test script
│   └── start-all.sh           # Start both API + Worker
└── docker-compose.yml         # PostgreSQL + Redis containers
```

### Key Changes Made
1. **Added Web UI** - `public/index.html` with real-time WebSocket updates
2. **Enhanced Debugging** - Comprehensive console logging in UI
3. **Testing Tools** - `scripts/check-orders.ts` to inspect database
4. **Startup Script** - `scripts/start-all.sh` to run both services
5. **Documentation** - Complete testing guide

---

## ⚡ Testing Instructions

### Step 1: Clean Environment
```bash
# Stop any running processes (already done)
pkill -f "ts-node src/api/server.ts"
pkill -f "ts-node src/worker/start.ts"

# Stop Docker containers if running
docker-compose down

# Clean up Docker volumes (optional - removes all data)
docker-compose down -v
```

### Step 2: Start Infrastructure
```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Wait 5 seconds for containers to be ready
sleep 5

# Verify containers are running
docker-compose ps
```

Expected output:
```
NAME                IMAGE                COMMAND                  SERVICE    STATUS
be-postgres-1       postgres:15-alpine   "docker-entrypoint.s…"   postgres   Up
be-redis-1          redis:7-alpine       "docker-entrypoint.s…"   redis      Up
```

### Step 3: Setup Database
```bash
# Run Prisma migrations
npx prisma migrate deploy

# (Optional) Generate Prisma client if needed
npx prisma generate
```

### Step 4: Start Application

**Option A: Using Startup Script (Recommended)**
```bash
# Open a terminal and run:
./scripts/start-all.sh
```

**Option B: Manual (Two Terminals)**
```bash
# Terminal 1 - Start API Server
npm run start:api

# Terminal 2 - Start Worker
npm run start:worker
```

You should see:
- Terminal 1: `Server listening on 3000`
- Terminal 2: `Worker is ready and connected to Redis`

---

## 🧪 Test Methods

### Method 1: Web Browser (Visual Test)

1. **Open browser**: http://localhost:3000

2. **Open DevTools**: Press `F12` (or right-click → Inspect)

3. **Go to Console tab** in DevTools

4. **Fill the form**:
   - Input Token: `SOL`
   - Output Token: `USDC`
   - Amount: `0.1`

5. **Click "Execute Order"**

6. **Watch the updates** in both UI and console:
   ```
   [LOG] INFO {message: "Submitting order..."}
   [LOG] PENDING {orderId: "...", message: "Order submitted to queue"}
   WebSocket connected
   [LOG] ROUTING {orderId: "...", status: "ROUTING"}
   [LOG] BUILDING {orderId: "...", dex: "RAYDIUM", price: 150}
   [LOG] SUBMITTED {orderId: "..."}
   [LOG] CONFIRMED {orderId: "...", txHash: "mock_tx_hash_..."}
   ```

7. **Expected time**: 2-5 seconds from PENDING to CONFIRMED

---

### Method 2: API Test (curl)

```bash
# Submit an order
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"SOL","outputToken":"USDC","amount":0.5}'
```

Expected response:
```json
{"orderId":"uuid-here","status":"PENDING"}
```

Then check the order status:
```bash
# Wait 3 seconds
sleep 3

# Check orders in database
npx ts-node scripts/check-orders.ts
```

You should see the order with status `CONFIRMED`.

---

### Method 3: E2E Test Script

```bash
npm run test:e2e
```

Expected output:
```
1. Submitting Order...
Order Submitted: uuid-here
2. Connecting to WebSocket...
WebSocket Connected
[WS Update] Status: PENDING | Tx: N/A
[WS Update] Status: ROUTING | Tx: N/A
[WS Update] Status: BUILDING | Tx: N/A
[WS Update] Status: SUBMITTED | Tx: N/A
[WS Update] Status: CONFIRMED | Tx: mock_tx_hash_...
Final State Reached. Test Complete.
```

---

### Method 4: Database Inspection

```bash
# View all orders and their statuses
npx ts-node scripts/check-orders.ts
```

Output shows:
- Order ID, Status, Token pair, Amount
- Transaction hash
- Timestamps
- Summary by status

---

## 🔍 Verification Checklist

### ✅ Infrastructure Running
```bash
docker-compose ps
```
Both `postgres` and `redis` should show `Up`

### ✅ API Server Running
```bash
curl http://localhost:3000/
```
Should return the HTML page (starts with `<!DOCTYPE html>`)

### ✅ Worker Connected
Check Terminal 2 output:
```
Worker is ready and connected to Redis
```

### ✅ Full Flow Test
1. Submit order via browser
2. See WebSocket updates in console
3. Order reaches `CONFIRMED` status
4. Check database shows the order

---

## 🛠️ Troubleshooting

### Issue: Port Already in Use
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Issue: Docker Containers Won't Start
```bash
# Check Docker is running
docker info

# Remove old containers and volumes
docker-compose down -v

# Start fresh
docker-compose up -d
```

### Issue: Database Connection Error
```bash
# Check .env file has correct credentials
cat .env | grep DATABASE_URL

# Should be:
# DATABASE_URL="postgresql://user:password@localhost:5432/order_engine?schema=public"

# Reset database
docker-compose down -v
docker-compose up -d
sleep 5
npx prisma migrate deploy
```

### Issue: Worker Not Processing Orders
```bash
# Check worker is running
ps aux | grep "ts-node src/worker/start.ts"

# Check worker logs in Terminal 2
# Should see: "Worker is ready and connected to Redis"

# If not running, start it:
npm run start:worker
```

### Issue: WebSocket Not Connecting
1. Open browser DevTools → Network → WS tab
2. Should see connection to `ws://localhost:3000/api/orders/ws`
3. If not, refresh the page
4. Check API server is running

---

## 📊 Understanding the Flow

```
┌─────────────┐
│   Browser   │
└──────┬──────┘
       │ HTTP POST /api/orders/execute
       ↓
┌─────────────┐      ┌──────────────┐
│ API Server  │─────→│  PostgreSQL  │ (Save order as PENDING)
└──────┬──────┘      └──────────────┘
       │
       │ Add to Queue
       ↓
┌─────────────┐      ┌──────────────┐
│ Redis Queue │◀────→│ Redis Pub/Sub│
└──────┬──────┘      └──────┬───────┘
       │                    │
       │ Pick Job           │ Publish Updates
       ↓                    │
┌─────────────┐            │
│   Worker    │────────────┘
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ DEX Router  │ (Find best price: Raydium vs Meteora)
└─────────────┘

Status Updates via WebSocket:
PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED
```

---

## 🎯 Quick Test Commands (Copy & Paste)

```bash
# Complete test sequence
docker-compose up -d && \
sleep 5 && \
npx prisma migrate deploy && \
npm run test:e2e

# Or with browser:
# 1. docker-compose up -d
# 2. ./scripts/start-all.sh
# 3. Open http://localhost:3000
```

---

## 🧹 Cleanup

```bash
# Stop application
pkill -f "ts-node"

# Stop Docker containers
docker-compose down

# Remove all data (optional)
docker-compose down -v
```

---

## 📝 Environment Variables

Your `.env` file should contain:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/order_engine?schema=public"
REDIS_HOST="localhost"
REDIS_PORT=6379
SOLANA_RPC_URL="https://api.devnet.solana.com"
PRIVATE_KEY="[221,188,250,...]"  # Your Solana keypair as JSON array
PORT=3000
```

---

## ✨ Key Features

1. **Concurrent Processing**: 10 orders at once via BullMQ
2. **Rate Limiting**: 100 orders per minute
3. **Smart Routing**: Chooses best price between Raydium & Meteora
4. **Real-time Updates**: WebSocket streams every status change
5. **Persistence**: All orders saved to PostgreSQL
6. **Mock Execution**: Currently uses mock DEX data (can be replaced with real SDK calls)

---

## 🎉 Success Criteria

You've successfully tested the system when:
- ✅ Docker containers running (postgres + redis)
- ✅ API server responds on port 3000
- ✅ Worker is processing jobs
- ✅ Orders go from PENDING → CONFIRMED
- ✅ WebSocket shows real-time updates
- ✅ Database contains order records
- ✅ Processing time: 2-5 seconds
