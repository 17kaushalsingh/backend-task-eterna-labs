# 🚀 Order Execution Engine

A high-performance backend system for executing **Market Orders** on Solana Devnet, featuring smart routing between Raydium and Meteora, concurrent order processing via BullMQ, and real-time WebSocket updates.

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy)

---

## 📋 Table of Contents

- [Why Market Order?](#why-market-order)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Quick Start](#quick-start)
- [Testing Dashboard](#testing-dashboard)
- [API Usage](#api-usage)
- [Deployment](#deployment)
- [Documentation](#documentation)
- [Project Structure](#project-structure)

---

## 🎯 Why Market Order?

I chose **Market Order** as the primary order type because it is the fundamental building block of DEX trading. It requires immediate execution and routing logic, which forms the core of any trading engine. 

**Extension Path:**
- **Limit Orders** → Add price trigger in worker
- **Sniper Orders** → Add time/event trigger
- Same routing and execution infrastructure

---

## ✨ Features

### Core Functionality
- ✅ **Smart DEX Routing** - Automatically selects best price between Raydium and Meteora
- ✅ **Concurrent Processing** - Handles up to 10 orders simultaneously via BullMQ
- ✅ **Real-time Updates** - WebSocket streams: PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED
- ✅ **Queue Management** - 100 orders/minute rate limiting with exponential backoff retry
- ✅ **Order Persistence** - Complete audit trail in PostgreSQL
- ✅ **Transaction Tracking** - Records all transaction hashes and routing decisions

### Testing Dashboard
- 📊 **DEX Price Comparison** - Visual side-by-side comparison
- 🔄 **Queue Visualization** - Real-time active orders and rate limit display
- 📈 **Statistics** - Total orders, success rate, average processing time
- 🧪 **Concurrent Testing** - Submit 5 or 10 orders at once
- 📡 **Live Status Log** - Color-coded WebSocket updates
- 📋 **Order History** - Recent orders with status tracking

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|-----------|
| **Runtime** | Node.js + TypeScript |
| **API Server** | Fastify (HTTP + WebSocket) |
| **Queue System** | BullMQ + Redis |
| **Database** | PostgreSQL + Prisma ORM |
| **Blockchain** | @solana/web3.js |
| **DEX Integration** | Raydium SDK, Meteora SDK |

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose
- Node.js v18+
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/17kaushalsingh/backend-task-eterna-labs.git
cd backend-task-eterna-labs

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env and add your Solana PRIVATE_KEY (JSON array format)

# Start infrastructure (PostgreSQL + Redis)
docker-compose up -d

# Wait for containers to be ready
sleep 5

# Run database migrations
npx prisma migrate deploy

# Start application
./scripts/start-all.sh
```

### Access Dashboard
Open **http://localhost:3000** in your browser

### Run Tests
```bash
# Automated end-to-end test
./test.sh

# Or manual test
npm run test:e2e

# Check orders in database
npx ts-node scripts/check-orders.ts
```

---

## 🎨 Testing Dashboard

The enhanced testing dashboard provides a comprehensive interface to test all backend features:

### Features
1. **Order Submission Form**
   - Select input/output tokens (SOL, USDC, USDT)
   - Enter amount
   - Submit single or multiple orders

2. **DEX Routing Comparison**
   - Real-time price comparison
   - Visual winner highlighting
   - Last quote display

3. **Queue Management**
   - Active orders counter (X/10)
   - Rate limit tracker (X/100 per minute)
   - Visual progress bar

4. **Statistics Panel**
   - Total orders
   - Confirmed/Failed counts
   - Average processing time

5. **Real-time Status Log**
   - Color-coded status updates
   - Order ID, DEX, price, TX hash
   - Auto-scrolling

6. **Recent Orders List**
   - Last 20 orders
   - Status badges
   - Complete order details

### Testing Scenarios

#### Single Order Test
```
1. Open http://localhost:3000
2. Fill form: SOL → USDC, Amount: 0.1
3. Click "Execute Order"
4. Watch status progression (2-5 seconds)
5. Verify CONFIRMED status
```

#### Concurrent Processing Test
```
1. Click "Submit 5 Orders" button
2. Watch queue visualization
3. Observe parallel processing
4. Check statistics update
```

#### Stress Test
```
1. Click "Test Concurrency (10 orders)"
2. Monitor queue at 100% capacity
3. Verify all orders complete
4. Check average time
```

---

## 📡 API Usage

### Execute Order
**POST** `/api/orders/execute`

**Request:**
```json
{
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 0.1
}
```

**Response:**
```json
{
  "orderId": "uuid-here",
  "status": "PENDING"
}
```

### WebSocket Updates
**Connect:** `ws://localhost:3000/api/orders/ws`

**Subscribe:**
```json
{
  "orderId": "YOUR_ORDER_ID"
}
```

**Status Updates:**
```json
{
  "orderId": "uuid",
  "status": "ROUTING"
}
{
  "orderId": "uuid",
  "status": "BUILDING",
  "data": {
    "dex": "RAYDIUM",
    "price": 150
  }
}
{
  "orderId": "uuid",
  "status": "CONFIRMED",
  "data": {
    "txHash": "mock_tx_hash_...",
    "price": 150
  }
}
```

### cURL Examples

```bash
# Submit order
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"SOL","outputToken":"USDC","amount":0.1}'

# Submit multiple orders (concurrent test)
for i in {1..5}; do
  curl -X POST http://localhost:3000/api/orders/execute \
    -H "Content-Type: application/json" \
    -d "{\"inputToken\":\"SOL\",\"outputToken\":\"USDC\",\"amount\":0.$i}" &
done
wait
```

---

## 🌐 Deployment

### Deploy to Render (Free Tier)

This project includes a **Render Blueprint** for one-click deployment:

**Quick Deploy:**
1. Click the "Deploy to Render" button above
2. Connect your GitHub account
3. Select this repository
4. Render auto-detects `render.yaml`
5. Add `PRIVATE_KEY` environment variable
6. Click "Apply"
7. Wait ~10 minutes for deployment

**What Gets Deployed:**
- ✅ PostgreSQL Database (Free: 1 GB storage)
- ✅ Redis Cache (Free: 25 MB)
- ✅ Web Service (Free: 512 MB RAM)
- ✅ Auto-deploy on git push
- ✅ HTTPS enabled
- ✅ Custom domain support

**Manual Deployment:**
See detailed guide in [RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection | Auto-filled by Render |
| `REDIS_HOST` | Redis hostname | Auto-filled by Render |
| `REDIS_PORT` | Redis port | Auto-filled by Render |
| `SOLANA_RPC_URL` | Solana RPC endpoint | `https://api.devnet.solana.com` |
| `PRIVATE_KEY` | Solana keypair (JSON array) | `[1,2,3,...]` |
| `PORT` | Server port | `3000` (local), `10000` (Render) |

### Getting Solana Private Key

```bash
# Generate new keypair
solana-keygen new --outfile ~/my-keypair.json

# View as JSON array
cat ~/my-keypair.json

# Airdrop devnet SOL
solana airdrop 2 <your-public-key> --url devnet
```

---

## 📚 Documentation

### Complete Guides

| Guide | Description |
|-------|-------------|
| **[FEATURE_TESTING_GUIDE.md](./FEATURE_TESTING_GUIDE.md)** | Complete feature testing guide with all backend features |
| **[QUICKSTART.md](./QUICKSTART.md)** | Detailed setup and testing instructions |
| **[TESTING.md](./TESTING.md)** | Testing scenarios and troubleshooting |
| **[RENDER_DEPLOYMENT.md](./RENDER_DEPLOYMENT.md)** | Comprehensive Render deployment guide |
| **[TEST_NOW.md](./TEST_NOW.md)** | Quick one-command testing |

### Key Documentation Sections

#### Feature Testing Guide
- Market order execution testing
- DEX routing comparison verification
- Queue management testing (10 concurrent orders)
- Rate limiting verification (100/min)
- WebSocket updates testing
- Database persistence verification

#### Deployment Guide
- Step-by-step Render deployment
- Environment variable configuration
- Troubleshooting common issues
- Monitoring and logging
- Cost breakdown (free tier)
- Upgrade options

---

## 📁 Project Structure

```
be/
├── src/
│   ├── api/
│   │   └── server.ts              # Fastify API + WebSocket server
│   ├── worker/
│   │   ├── orderProcessor.ts      # BullMQ worker - processes orders
│   │   └── start.ts               # Worker entry point
│   ├── dex/
│   │   ├── router.ts              # Smart routing logic
│   │   ├── raydium.ts             # Raydium DEX adapter
│   │   ├── meteora.ts             # Meteora DEX adapter
│   │   └── types.ts               # Type definitions
│   ├── queue/
│   │   └── orderQueue.ts          # BullMQ queue configuration
│   └── utils/
│       ├── redis.ts               # Redis pub/sub clients
│       └── solana.ts              # Solana connection & wallet
├── prisma/
│   ├── schema.prisma              # Database schema
│   └── migrations/                # Database migrations
├── public/
│   └── index.html                 # Testing dashboard
├── scripts/
│   ├── check-orders.ts            # View orders in database
│   ├── test-execution.ts          # E2E test script
│   ├── start-all.sh               # Start API + Worker
│   └── generate-wallet.ts         # Generate Solana wallet
├── docker-compose.yml             # PostgreSQL + Redis containers
├── render.yaml                    # Render Blueprint configuration
├── package.json                   # Dependencies and scripts
└── tsconfig.json                  # TypeScript configuration
```

---

## 🔍 How It Works

### Order Execution Flow

```
┌─────────────┐
│   Browser   │ Submit order (SOL → USDC, 0.1)
└──────┬──────┘
       │ HTTP POST /api/orders/execute
       ↓
┌─────────────┐      ┌──────────────┐
│ API Server  │─────→│  PostgreSQL  │ Save order (PENDING)
└──────┬──────┘      └──────────────┘
       │
       │ Add to BullMQ queue
       ↓
┌─────────────┐      ┌──────────────┐
│ Redis Queue │◀────→│ Redis Pub/Sub│ WebSocket updates
└──────┬──────┘      └──────┬───────┘
       │                    │
       │ Pick job           │ Publish status
       ↓                    │
┌─────────────┐            │
│   Worker    │────────────┘
└──────┬──────┘
       │
       ↓
┌─────────────┐
│ DEX Router  │ Compare Raydium vs Meteora
└──────┬──────┘
       │
       ↓ Select best price
┌─────────────┐
│ Execute Tx  │ RAYDIUM: $150 (winner)
└─────────────┘ METEORA: $148

Status: PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED
```

### DEX Routing Logic

1. **Fetch Quotes** - Query both Raydium and Meteora simultaneously
2. **Compare Prices** - Calculate best `outAmount` for given `inAmount`
3. **Select Winner** - Choose DEX with better execution price
4. **Build Transaction** - Create swap transaction for selected DEX
5. **Execute** - Submit transaction to Solana network
6. **Confirm** - Wait for transaction confirmation

### Queue Management

- **Concurrency:** 10 workers process orders simultaneously
- **Rate Limit:** 100 orders per minute
- **Retry Logic:** Exponential backoff, max 3 attempts
- **Failure Handling:** Failed orders marked with error message

---

## 🧪 Testing

### Automated Tests

```bash
# Complete automated test (recommended)
./test.sh

# E2E test with WebSocket
npm run test:e2e

# Check database
npx ts-node scripts/check-orders.ts
```

### Manual Testing

```bash
# Start services
docker-compose up -d && sleep 5
npx prisma migrate deploy
./scripts/start-all.sh

# Open dashboard
open http://localhost:3000

# Or test via API
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"SOL","outputToken":"USDC","amount":0.1}'
```

### Verification Checklist

- [ ] ✅ Docker containers running
- [ ] ✅ API responds on http://localhost:3000
- [ ] ✅ Worker logs show "ready and connected to Redis"
- [ ] ✅ Order submitted successfully
- [ ] ✅ WebSocket shows status updates
- [ ] ✅ Order reaches CONFIRMED status
- [ ] ✅ Database contains order record
- [ ] ✅ Processing time < 5 seconds
- [ ] ✅ DEX routing decision logged
- [ ] ✅ Transaction hash recorded

---

## 🐛 Troubleshooting

### Common Issues

**Port already in use:**
```bash
lsof -i :3000
kill -9 <PID>
```

**Docker containers won't start:**
```bash
docker-compose down -v
docker-compose up -d
```

**Database connection error:**
```bash
# Check .env file
cat .env | grep DATABASE_URL

# Reset database
docker-compose down -v
docker-compose up -d
sleep 5
npx prisma migrate deploy
```

**Worker not processing orders:**
```bash
# Check worker is running
ps aux | grep "ts-node src/worker/start.ts"

# Check logs
tail -f /tmp/be-worker.log
```

**WebSocket not connecting:**
- Open DevTools → Network → WS tab
- Refresh page
- Check API server is running

---

## 📊 Performance

### Expected Metrics
- **Order Processing Time:** 2-5 seconds
- **Concurrent Orders:** Up to 10 simultaneously
- **Throughput:** 100 orders/minute
- **Success Rate:** >95% (with proper configuration)
- **Database Queries:** <50ms average
- **WebSocket Latency:** <100ms

### Monitoring

```bash
# View API logs
tail -f /tmp/be-api.log

# View Worker logs
tail -f /tmp/be-worker.log

# Check system resources
docker stats

# Monitor PostgreSQL
docker exec -it be-postgres-1 psql -U user -d order_engine -c "SELECT COUNT(*), status FROM \"Order\" GROUP BY status;"
```

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 🔗 Links

- **GitHub Repository:** https://github.com/17kaushalsingh/backend-task-eterna-labs
- **Live Demo:** Coming soon
- **Render Deployment:** [Deploy Now](https://render.com/deploy)

---

## 📞 Support

For issues, questions, or contributions:
- Open an issue on GitHub
- Check the documentation guides
- Review troubleshooting section

---

**Built with ❤️ for Solana DEX trading**