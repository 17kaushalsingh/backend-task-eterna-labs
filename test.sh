#!/bin/bash

# Quick Test Script for Order Execution Engine
set -e

echo "🚀 Order Execution Engine - Quick Test"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Step 1: Start Docker
echo -e "${BLUE}[1/5]${NC} Starting Docker containers..."
docker-compose up -d
sleep 5

# Step 2: Check Docker
echo -e "${BLUE}[2/5]${NC} Verifying containers..."
if ! docker-compose ps | grep -q "Up"; then
    echo -e "${RED}❌ Docker containers failed to start${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Containers running${NC}"

# Step 3: Setup Database
echo -e "${BLUE}[3/5]${NC} Setting up database..."
npx prisma migrate deploy > /dev/null 2>&1
echo -e "${GREEN}✓ Database ready${NC}"

# Step 4: Start Services
echo -e "${BLUE}[4/5]${NC} Starting API and Worker..."
npm run start:api > /tmp/be-api.log 2>&1 &
API_PID=$!
sleep 2

npm run start:worker > /tmp/be-worker.log 2>&1 &
WORKER_PID=$!
sleep 3

# Check if services started
if ! ps -p $API_PID > /dev/null; then
    echo -e "${RED}❌ API failed to start. Check /tmp/be-api.log${NC}"
    exit 1
fi

if ! ps -p $WORKER_PID > /dev/null; then
    echo -e "${RED}❌ Worker failed to start. Check /tmp/be-worker.log${NC}"
    kill $API_PID 2>/dev/null
    exit 1
fi

echo -e "${GREEN}✓ Services started (API: $API_PID, Worker: $WORKER_PID)${NC}"

# Step 5: Run Test
echo -e "${BLUE}[5/5]${NC} Running E2E test..."
sleep 2

if npm run test:e2e; then
    echo ""
    echo -e "${GREEN}✅ TEST PASSED!${NC}"
    echo ""
    echo "You can now:"
    echo "  • Open browser: http://localhost:3000"
    echo "  • Check orders: npx ts-node scripts/check-orders.ts"
    echo "  • View API logs: tail -f /tmp/be-api.log"
    echo "  • View Worker logs: tail -f /tmp/be-worker.log"
    echo ""
    echo "Services are still running. To stop:"
    echo "  • kill $API_PID $WORKER_PID"
    echo "  • docker-compose down"
else
    echo -e "${RED}❌ TEST FAILED${NC}"
    kill $API_PID $WORKER_PID 2>/dev/null
    exit 1
fi
