# Testing Guide - Order Execution Engine

## Quick Start

### Prerequisites
1. **Redis** - Must be running on port 6379
   ```bash
   # Check if Redis is running
   lsof -i :6379
   ```

2. **PostgreSQL** - Database must be configured
   ```bash
   # Check connection in .env file
   cat .env | grep DATABASE_URL
   ```

3. **Dependencies** - Install all packages
   ```bash
   npm install
   ```

### Running the Application

#### Option 1: Start All Services (Recommended)
```bash
./scripts/start-all.sh
```

#### Option 2: Start Services Separately
```bash
# Terminal 1 - API Server
npm run start:api

# Terminal 2 - Worker
npm run start:worker
```

## Testing the Application

### 1. Web Interface Test
1. Open your browser to: http://localhost:3000
2. Fill in the form:
   - Input Token: SOL
   - Output Token: USDC
   - Amount: 0.1
3. Click "Execute Order"
4. Open Browser DevTools (F12) to see console logs
5. You should see status updates in real-time:
   - PENDING → ROUTING → BUILDING → SUBMITTED → CONFIRMED

### 2. API Test (curl)
```bash
# Submit an order
curl -X POST http://localhost:3000/api/orders/execute \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"SOL","outputToken":"USDC","amount":0.1}'
```

Expected response:
```json
{"orderId":"uuid-here","status":"PENDING"}
```

### 3. Check Order Status
```bash
# Run the order checker script
npx ts-node scripts/check-orders.ts
```

This will show:
- List of recent orders
- Status of each order
- Transaction hashes
- Summary by status

## Troubleshooting

### Issue: Orders Stuck in PENDING

**Possible Causes:**
1. Worker is not running
   ```bash
   ps aux | grep "ts-node src/worker/start.ts"
   ```

2. Redis connection issue
   ```bash
   lsof -i :6379
   ```

3. BullMQ queue not processing
   - Check worker logs for errors

**Solution:**
- Make sure both API server AND worker are running
- Restart both services if needed

### Issue: WebSocket Not Connecting

**Check:**
1. Open Browser DevTools → Network → WS tab
2. Look for connection to `/api/orders/ws`
3. Check console for WebSocket errors

**Common fixes:**
- Refresh the page
- Clear browser cache
- Check if API server is running

### Issue: No Updates in UI

**Debug steps:**
1. Open Browser DevTools → Console
2. Submit an order
3. Look for these logs:
   - "Order created: [orderId]"
   - "WebSocket connected"
   - "WebSocket message received: ..."

If you see messages but no UI updates:
- Check that status messages match expected format
- Verify CSS classes are working (check Elements tab)

## System Architecture

```
┌─────────────────┐
│   Web Browser   │
│  (index.html)   │
└────────┬────────┘
         │ HTTP POST
         ↓
┌─────────────────┐      ┌──────────────┐
│   API Server    │─────→│  PostgreSQL  │
│  (server.ts)    │      │   Database   │
└────────┬────────┘      └──────────────┘
         │
         │ BullMQ
         ↓
┌─────────────────┐      ┌──────────────┐
│   Redis Queue   │      │    Redis     │
│   (Bull MQ)     │◀────→│  Pub/Sub     │
└────────┬────────┘      └──────┬───────┘
         │                      │
         ↓                      │
┌─────────────────┐            │
│  Worker Process │            │
│ (orderProcessor)│────────────┘
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   DEX Router    │
│ (Raydium/       │
│  Meteora)       │
└─────────────────┘
```

## Order Processing Flow

1. **Submit** - Order created in database with PENDING status
2. **Queue** - Order added to BullMQ queue
3. **Process** - Worker picks up order and begins processing
   - Status: ROUTING (finding best DEX)
   - Status: BUILDING (building transaction)
   - Status: SUBMITTED (transaction sent)
4. **Complete** - Transaction confirmed
   - Status: CONFIRMED (success) or FAILED (error)

## Expected Processing Time

- Typical order: 2-5 seconds
- With mock DEX data: 1-3 seconds
- Maximum timeout: 30 seconds (WebSocket)

## Useful Commands

```bash
# Check all orders
npx ts-node scripts/check-orders.ts

# Test API endpoint
curl http://localhost:3000/api/orders/execute \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"inputToken":"SOL","outputToken":"USDC","amount":0.1}'

# Check running processes
ps aux | grep "ts-node"

# Check Redis connection
lsof -i :6379

# View API logs (if running in terminal 1)
# Just look at the terminal output

# View Worker logs (if running in terminal 2)
# Just look at the terminal output
```

## Notes

- The application uses **mock DEX data** for demonstration
- Orders are processed with **Raydium** and **Meteora** adapters
- Real Solana RPC connection is configured but transactions are mocked
- All order history is persisted in PostgreSQL
