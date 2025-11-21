# Order Execution Engine

A high-performance backend system for executing Market Orders on Solana Devnet, featuring smart routing between Raydium and Meteora, concurrency management via BullMQ, and real-time WebSocket updates.

## Why Market Order?
I chose **Market Order** as the primary order type because it is the fundamental building block of DEX trading. It requires immediate execution and routing logic, which forms the core of any trading engine. This engine can be easily extended to support **Limit Orders** (by adding a price trigger in the worker) and **Sniper Orders** (by adding a time/event trigger) using the same routing and execution infrastructure.

## Features
- **Smart Routing**: Automatically selects the best price between Raydium and Meteora.
- **Concurrency**: Processes up to 10 concurrent orders using BullMQ and Redis.
- **Real-time Updates**: WebSocket streams order status (Pending -> Routing -> Submitted -> Confirmed).
- **Robustness**: Exponential backoff retries and persistent order history in PostgreSQL.

## Tech Stack
- **Runtime**: Node.js + TypeScript
- **API**: Fastify (HTTP + WebSocket)
- **Queue**: BullMQ + Redis
- **Database**: PostgreSQL + Prisma
- **Blockchain**: @solana/web3.js

## Setup

1. **Prerequisites**
   - Docker & Docker Compose
   - Node.js v18+

2. **Installation**
   ```bash
   npm install
   ```

3. **Environment**
   Copy `.env.example` to `.env` and configure:
   ```bash
   cp .env.example .env
   # Update PRIVATE_KEY with a valid Solana Devnet keypair (JSON array)
   ```

4. **Start Infrastructure**
   ```bash
   docker-compose up -d
   ```

5. **Build & Run**
   ```bash
   npm run build
   
   # Start API
   npm run start:api
   
   # Start Worker (in a separate terminal)
   node dist/worker/start.js
   ```

## API Usage

### Execute Order
**POST** `/api/orders/execute`
```json
{
  "inputToken": "SOL",
  "outputToken": "USDC",
  "amount": 0.1
}
```

### WebSocket Updates
Connect to `ws://localhost:3000/api/orders/ws` and send:
```json
{ "orderId": "YOUR_ORDER_ID" }
```

## Testing
Run the end-to-end test script:
```bash
npm run test:e2e
```