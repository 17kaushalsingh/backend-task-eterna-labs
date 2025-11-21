# ⚡ TEST NOW - One Command

All processes have been terminated. The system is clean and ready to test.

## 🎯 Option 1: Automated Test (Recommended)

```bash
./test.sh
```

This will:
1. ✅ Start Docker (PostgreSQL + Redis)
2. ✅ Setup database
3. ✅ Start API server
4. ✅ Start worker
5. ✅ Run E2E test
6. ✅ Show success message

**Time**: ~20 seconds

---

## 🎯 Option 2: Manual Test (Visual)

```bash
# Start infrastructure
docker-compose up -d

# Wait for containers
sleep 5

# Setup database
npx prisma migrate deploy

# Start services (keep this terminal open)
./scripts/start-all.sh
```

Then:
1. Open browser: **http://localhost:3000**
2. Press **F12** to open DevTools
3. Click "Execute Order"
4. Watch real-time updates in Console tab

**Expected**: Order goes from PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED in 2-5 seconds

---

## 🎯 Option 3: Quick API Test

```bash
# Start everything
docker-compose up -d && sleep 5 && npx prisma migrate deploy

# Terminal 1
npm run start:api

# Terminal 2 (new terminal)
npm run start:worker

# Terminal 3 (new terminal)
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"SOL","outputToken":"USDC","amount":0.1}'

# Wait 3 seconds then check
sleep 3
npx ts-node scripts/check-orders.ts
```

---

## 📊 What You Should See

### Console Output (Browser F12)
```
[LOG] INFO {message: "Submitting order..."}
Order created: 0803830a-ed87-4081-b1a6-6e81cecc78a2 PENDING
WebSocket connected
Sending subscribe message: {"orderId":"..."}
WebSocket message received: {"orderId":"...","status":"PENDING"}
[LOG] PENDING {...}
[LOG] ROUTING {...}
[LOG] BUILDING {dex: "RAYDIUM", price: 150}
[LOG] SUBMITTED {...}
[LOG] CONFIRMED {txHash: "mock_tx_hash_1763724978426", price: 150}
Order completed with status: CONFIRMED
```

### Database Output
```
📊 Fetching all orders...

Found 1 orders:

1. Order ID: 0803830a-ed87-4081-b1a6-6e81cecc78a2
   Status: CONFIRMED
   Type: MARKET
   Pair: SOL → USDC
   Amount: 0.1
   TX Hash: mock_tx_hash_1763724978426
   Created: Fri Nov 21 2025 17:06:18 GMT+0530

📈 Status Summary:
   CONFIRMED: 1
```

---

## 🧪 All Test Commands

| Test Type | Command | Time |
|-----------|---------|------|
| **Automated E2E** | `./test.sh` | 20s |
| **Manual E2E** | `npm run test:e2e` | 5s |
| **Browser UI** | Open http://localhost:3000 | Manual |
| **API curl** | See Option 3 above | 5s |
| **Check DB** | `npx ts-node scripts/check-orders.ts` | 2s |

---

## 🔧 System Status Commands

```bash
# Check Docker
docker-compose ps

# Check ports
lsof -i :3000 :5432 :6379

# Check processes
ps aux | grep -E "ts-node.*server|ts-node.*worker"

# View logs
tail -f /tmp/be-api.log
tail -f /tmp/be-worker.log
```

---

## 🧹 Cleanup

```bash
# Stop everything
pkill -f ts-node
docker-compose down

# Remove all data
docker-compose down -v
```

---

## 📁 Important Files

- **QUICKSTART.md** - Complete testing guide with troubleshooting
- **test.sh** - Automated test script
- **scripts/check-orders.ts** - Database inspector
- **public/index.html** - Web UI with WebSocket debugging
- **docker-compose.yml** - PostgreSQL + Redis

---

## ✅ Success Checklist

- [ ] Docker containers running
- [ ] API responds on http://localhost:3000
- [ ] Worker logs show "ready and connected to Redis"
- [ ] Order submitted via browser/curl
- [ ] WebSocket shows status updates
- [ ] Order status changes to CONFIRMED
- [ ] Database shows order record
- [ ] Processing time < 5 seconds

**You're ready to go! Start with:** `./test.sh`
