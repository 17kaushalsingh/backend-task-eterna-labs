# 🧪 Feature Testing Guide - Order Execution Engine

This guide demonstrates how to test all the core features of the Order Execution Engine as specified in the initial requirements.

## 📋 Core Features Implemented

### ✅ 1. Market Order Execution
**Requirement:** Immediate execution at current price

**Implementation:**
- Orders are processed immediately upon submission
- No price conditions or delays
- Executes at best available market price

**How to Test:**
1. Open http://localhost:3000
2. Select tokens (e.g., SOL → USDC)
3. Enter amount (e.g., 0.1)
4. Click "Execute Order"
5. Watch real-time status updates

**Expected Result:**
- Order progresses: PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED
- Processing time: 2-5 seconds
- Transaction hash recorded in database

---

### ✅ 2. DEX Router Implementation with Price Comparison
**Requirement:** Query both Raydium and Meteora, route to best price

**Implementation:**
- `DexRouter` class fetches quotes from both DEXs concurrently
- Compares `outAmount` to determine best price
- Routes order to DEX with better execution price
- Logs routing decision for transparency

**Code Location:**
- [`src/dex/router.ts`](file:///Users/kaushal/Desktop/be/src/dex/router.ts) - Main routing logic
- [`src/dex/raydium.ts`](file:///Users/kaushal/Desktop/be/src/dex/raydium.ts) - Raydium adapter
- [`src/dex/meteora.ts`](file:///Users/kaushal/Desktop/be/src/dex/meteora.ts) - Meteora adapter

**How to Test:**
1. Submit an order through the dashboard
2. Watch the "DEX Routing Comparison" section
3. Observe which DEX is selected (highlighted in green)
4. Check the status log for routing decision

**Expected Result:**
```
ROUTING: Finding best DEX price...
BUILDING: Building transaction on RAYDIUM [Price: 150]
```

**Dashboard Visualization:**
- Shows last quote from both Raydium and Meteora
- Highlights the winning DEX with green border
- Displays price comparison side-by-side

---

### ✅ 3. Queue Management for Concurrent Orders
**Requirement:** 
- Process up to 10 concurrent orders
- Handle 100 orders/minute rate limit
- Exponential backoff retry (≤3 attempts)

**Implementation:**
- **BullMQ** queue with Redis backend
- **Concurrency:** 10 workers processing simultaneously
- **Rate Limit:** 100 orders per 60 seconds
- **Retry Logic:** Exponential backoff with max 3 attempts

**Code Location:**
- [`src/worker/orderProcessor.ts`](file:///Users/kaushal/Desktop/be/src/worker/orderProcessor.ts) - Lines 77-84

```typescript
export const orderWorker = new Worker('order-execution', processOrder, {
    connection: redisConnection,
    concurrency: 10,        // ✅ 10 concurrent orders
    limiter: {
        max: 100,           // ✅ 100 orders per minute
        duration: 60000
    }
});
```

**How to Test:**

#### Test Concurrency (10 orders):
1. Click "Test Concurrency (10 orders)" button
2. Watch the "Queue Status" section
3. Observe "Active Orders: X / 10" counter
4. See the queue bar fill up
5. Watch all 10 orders process concurrently

#### Test Rate Limiting:
1. Click "Test Concurrency (10 orders)" multiple times rapidly
2. Submit more than 100 orders within a minute
3. Observe rate limiting in action

#### Test Multiple Orders:
1. Click "Submit 5 Orders" button
2. Watch orders being queued and processed
3. Observe concurrent processing in real-time

**Expected Result:**
- Queue bar shows fill percentage (0-100%)
- Active orders counter updates in real-time
- Orders process concurrently (multiple orders in ROUTING/BUILDING state simultaneously)
- Rate limit prevents exceeding 100 orders/minute

---

### ✅ 4. Real-time WebSocket Status Updates
**Requirement:** HTTP → WebSocket pattern with live status streaming

**Implementation:**
- Single endpoint handles both HTTP POST and WebSocket upgrade
- Initial POST returns `orderId`
- WebSocket streams status updates via Redis Pub/Sub
- Status progression: PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED

**Code Location:**
- [`src/api/server.ts`](file:///Users/kaushal/Desktop/be/src/api/server.ts) - Lines 51-92

**How to Test:**
1. Open browser DevTools (F12) → Console tab
2. Submit an order
3. Watch console logs for WebSocket messages
4. Observe status updates in the "Real-time Status Updates" section

**Expected Console Output:**
```javascript
WebSocket connected
WebSocket message received: {orderId: "...", status: "PENDING"}
WebSocket message received: {orderId: "...", status: "ROUTING"}
WebSocket message received: {orderId: "...", status: "BUILDING", data: {dex: "RAYDIUM", price: 150}}
WebSocket message received: {orderId: "...", status: "SUBMITTED"}
WebSocket message received: {orderId: "...", status: "CONFIRMED", data: {txHash: "mock_tx_hash_..."}}
```

**Dashboard Features:**
- Color-coded log entries for each status
- Real-time updates without page refresh
- Automatic scrolling to latest updates
- Shows order ID, DEX, price, and transaction hash

---

### ✅ 5. Order History & Persistence
**Requirement:** PostgreSQL database for order history

**Implementation:**
- All orders persisted to PostgreSQL via Prisma ORM
- Tracks: order type, tokens, amount, status, txHash, logs, timestamps
- Status updates modify database records
- Complete audit trail

**Database Schema:**
```sql
Table "Order"
- id (UUID)
- type (MARKET)
- inputToken
- outputToken
- amount
- status
- txHash
- logs (JSONB)
- error
- createdAt
- updatedAt
```

**How to Test:**
1. Submit several orders
2. Check database directly:
   ```bash
   npx ts-node scripts/check-orders.ts
   ```
3. Or query PostgreSQL:
   ```bash
   docker exec be-postgres-1 psql -U user -d order_engine -c "SELECT * FROM \"Order\" ORDER BY \"createdAt\" DESC LIMIT 10;" --pset pager=off
   ```

**Expected Result:**
- All orders recorded with complete details
- Status updates reflected in database
- Transaction hashes stored
- Logs contain routing decisions and prices

---

### ✅ 6. Error Handling & Retry Logic
**Requirement:** Exponential backoff retry (≤3 attempts), persist failure reason

**Implementation:**
- BullMQ automatic retry with exponential backoff
- Failed orders marked with FAILED status
- Error messages stored in database
- Retry attempts logged

**How to Test:**
1. Simulate failure by stopping the worker
2. Submit an order
3. Restart worker
4. Watch order retry and eventually fail or succeed

**Expected Behavior:**
- Failed orders show in statistics
- Error message displayed in status log
- Database contains failure reason

---

## 🎯 Complete Testing Workflow

### Step 1: Start Services
```bash
# Start infrastructure
docker-compose up -d

# Wait for containers
sleep 5

# Setup database
npx prisma migrate deploy

# Start API and Worker
./scripts/start-all.sh
```

### Step 2: Open Dashboard
Navigate to: **http://localhost:3000**

### Step 3: Test Individual Features

#### A. Single Order Test
1. Submit one order
2. Watch status progression
3. Verify DEX selection
4. Check transaction hash

#### B. Concurrent Processing Test
1. Click "Submit 5 Orders"
2. Watch queue visualization
3. Observe concurrent processing
4. Check statistics update

#### C. Stress Test
1. Click "Test Concurrency (10 orders)"
2. Monitor queue at 100% capacity
3. Verify all orders complete
4. Check average processing time

#### D. DEX Comparison Test
1. Submit multiple orders
2. Watch DEX comparison section
3. Observe price differences
4. Verify best price selection

### Step 4: Verify Database
```bash
npx ts-node scripts/check-orders.ts
```

Expected output:
- List of all orders
- Status distribution
- Transaction hashes
- Processing logs

---

## 📊 Dashboard Features

### Statistics Panel
- **Total Orders:** Count of all submitted orders
- **Confirmed:** Successfully completed orders
- **Failed:** Orders that encountered errors
- **Avg Time:** Average processing time in seconds

### DEX Routing Comparison
- Shows last quote from Raydium and Meteora
- Highlights winning DEX with green border
- Updates in real-time during order processing

### Queue Status
- **Active Orders:** Current orders being processed (max 10)
- **Rate Limit:** Orders processed in current minute (max 100)
- **Visual Bar:** Queue capacity visualization

### Real-time Status Log
- Color-coded status updates
- Shows order ID, DEX, price, transaction hash
- Auto-scrolls to latest updates
- Keeps last 50 entries

### Recent Orders List
- Shows last 20 orders
- Displays current status
- Shows DEX and price information
- Includes transaction hash for confirmed orders

---

## 🔍 Verification Checklist

- [ ] ✅ Market orders execute immediately
- [ ] ✅ DEX router compares Raydium and Meteora prices
- [ ] ✅ Best price DEX is selected automatically
- [ ] ✅ Queue processes up to 10 concurrent orders
- [ ] ✅ Rate limit enforces 100 orders/minute
- [ ] ✅ WebSocket provides real-time status updates
- [ ] ✅ All status transitions are tracked (PENDING → CONFIRMED)
- [ ] ✅ Orders are persisted to PostgreSQL
- [ ] ✅ Transaction hashes are recorded
- [ ] ✅ Routing decisions are logged
- [ ] ✅ Failed orders are handled gracefully
- [ ] ✅ Statistics update in real-time
- [ ] ✅ Dashboard visualizes all features

---

## 🚀 Quick Test Commands

```bash
# Complete automated test
./test.sh

# Check all orders in database
npx ts-node scripts/check-orders.ts

# View API logs
tail -f /tmp/be-api.log

# View Worker logs
tail -f /tmp/be-worker.log

# Check Docker containers
docker-compose ps

# Check running processes
ps aux | grep ts-node

# Stop all services
pkill -f ts-node
docker-compose down
```

---

## 📝 Notes

- **Mock DEX Data:** Currently using mock prices (Raydium: 150, Meteora: 148) for demonstration
- **Mock Transactions:** Transaction hashes are mocked (`mock_tx_hash_[timestamp]`)
- **Real Devnet:** Can be enabled by implementing actual Raydium/Meteora SDK calls
- **WebSocket:** Automatically reconnects if connection drops
- **Queue:** Persists across restarts via Redis

---

## 🎥 Demo Scenarios

### Scenario 1: Basic Order Flow
1. Submit single order
2. Watch status progression
3. Verify completion in 2-5 seconds

### Scenario 2: Concurrent Processing
1. Submit 5 orders simultaneously
2. Watch queue fill up
3. Observe parallel processing
4. Verify all complete successfully

### Scenario 3: Stress Test
1. Submit 10 orders at once
2. Monitor queue at capacity
3. Check rate limiting
4. Verify system stability

### Scenario 4: DEX Routing
1. Submit multiple orders
2. Watch DEX comparison
3. Verify best price selection
4. Check routing logs

---

## ✅ Success Criteria

Your application is working correctly when:

1. ✅ Orders progress through all status stages
2. ✅ DEX comparison shows price differences
3. ✅ Queue handles 10 concurrent orders
4. ✅ WebSocket updates appear in real-time
5. ✅ Statistics update accurately
6. ✅ Database contains all order records
7. ✅ Transaction hashes are generated
8. ✅ Processing time is 2-5 seconds
9. ✅ No errors in logs
10. ✅ Dashboard is responsive and intuitive

**All features are now testable through the enhanced dashboard at http://localhost:3000** 🎉
