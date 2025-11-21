#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  Order Execution Engine - Starting... ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check if Redis is running
echo -e "${YELLOW}→ Checking Redis connection...${NC}"
if nc -z localhost 6379 2>/dev/null; then
    echo -e "${GREEN}✓ Redis is running on port 6379${NC}"
else
    echo -e "${YELLOW}⚠ Redis doesn't appear to be running on port 6379${NC}"
    echo "  Please start Redis (e.g., 'redis-server' or via Docker)"
    exit 1
fi

echo ""
echo -e "${YELLOW}→ Starting API Server...${NC}"
npm run start:api &
API_PID=$!
echo -e "${GREEN}✓ API Server started (PID: $API_PID)${NC}"

echo ""
echo -e "${YELLOW}→ Starting Worker...${NC}"
npm run start:worker &
WORKER_PID=$!
echo -e "${GREEN}✓ Worker started (PID: $WORKER_PID)${NC}"

echo ""
echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║         Services Running!              ║${NC}"
echo -e "${BLUE}╠════════════════════════════════════════╣${NC}"
echo -e "${BLUE}║  API:    http://localhost:3000         ║${NC}"
echo -e "${BLUE}║  UI:     http://localhost:3000         ║${NC}"
echo -e "${BLUE}║                                        ║${NC}"
echo -e "${BLUE}║  Press Ctrl+C to stop all services    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Wait for any process to exit
wait -n

# Exit with status of process that exited first
exit $?
