#!/bin/bash

# Render Deployment Script
# This script deploys the Order Execution Engine to Render using the API

set -e

RENDER_API_KEY="rnd_k2Twu4Es6Ap5WsBKgwCmz85Tl5l4"
REPO_URL="https://github.com/17kaushalsingh/backend-task-eterna-labs"
BRANCH="main"

echo "🚀 Deploying Order Execution Engine to Render..."
echo ""

# Step 1: Create PostgreSQL Database
echo "📦 Step 1/4: Creating PostgreSQL Database..."
DB_RESPONSE=$(curl -s -X POST https://api.render.com/v1/postgres \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "order-engine-db",
    "databaseName": "order_engine",
    "databaseUser": "orderengine",
    "plan": "free",
    "region": "oregon"
  }')

DB_ID=$(echo $DB_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Database created: $DB_ID"
echo ""

# Wait for database to be ready
echo "⏳ Waiting for database to be ready (30 seconds)..."
sleep 30

# Step 2: Create Redis
echo "📦 Step 2/4: Creating Redis Instance..."
REDIS_RESPONSE=$(curl -s -X POST https://api.render.com/v1/redis \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "order-engine-redis",
    "plan": "free",
    "region": "oregon",
    "maxmemoryPolicy": "noeviction"
  }')

REDIS_ID=$(echo $REDIS_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
echo "✅ Redis created: $REDIS_ID"
echo ""

# Wait for Redis to be ready
echo "⏳ Waiting for Redis to be ready (20 seconds)..."
sleep 20

# Step 3: Get Database Connection String
echo "📦 Step 3/4: Getting Database Connection String..."
DB_INFO=$(curl -s -X GET "https://api.render.com/v1/postgres/$DB_ID" \
  -H "Authorization: Bearer $RENDER_API_KEY")

# Step 4: Create Web Service
echo "📦 Step 4/4: Creating Web Service..."
WEB_RESPONSE=$(curl -s -X POST https://api.render.com/v1/services \
  -H "Authorization: Bearer $RENDER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"type\": \"web_service\",
    \"name\": \"order-execution-engine\",
    \"repo\": \"$REPO_URL\",
    \"branch\": \"$BRANCH\",
    \"runtime\": \"node\",
    \"plan\": \"free\",
    \"region\": \"oregon\",
    \"buildCommand\": \"npm install && npx prisma generate && npm run build\",
    \"startCommand\": \"npx prisma migrate deploy && npm start\",
    \"healthCheckPath\": \"/\",
    \"autoDeploy\": true,
    \"envVars\": [
      {
        \"key\": \"NODE_ENV\",
        \"value\": \"production\"
      },
      {
        \"key\": \"PORT\",
        \"value\": \"10000\"
      },
      {
        \"key\": \"DATABASE_URL\",
        \"fromDatabase\": {
          \"id\": \"$DB_ID\",
          \"property\": \"connectionString\"
        }
      },
      {
        \"key\": \"REDIS_URL\",
        \"fromService\": {
          \"id\": \"$REDIS_ID\",
          \"property\": \"connectionString\"
        }
      },
      {
        \"key\": \"SOLANA_RPC_URL\",
        \"value\": \"https://api.devnet.solana.com\"
      }
    ]
  }")

WEB_ID=$(echo $WEB_RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
WEB_URL=$(echo $WEB_RESPONSE | grep -o '"url":"[^"]*"' | head -1 | cut -d'"' -f4)

echo "✅ Web Service created: $WEB_ID"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                  🎉 Deployment Initiated!                      ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Database ID:  $DB_ID"
echo "║  Redis ID:     $REDIS_ID"
echo "║  Service ID:   $WEB_ID"
echo "║  Service URL:  $WEB_URL"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  ⚠️  IMPORTANT: Add PRIVATE_KEY environment variable           ║"
echo "║                                                                ║"
echo "║  1. Go to: https://dashboard.render.com/web/$WEB_ID"
echo "║  2. Click 'Environment'                                        ║"
echo "║  3. Add: PRIVATE_KEY = [your Solana keypair JSON array]       ║"
echo "║  4. Save and redeploy                                          ║"
echo "╠════════════════════════════════════════════════════════════════╣"
echo "║  Deployment will take ~10 minutes                              ║"
echo "║  Monitor at: https://dashboard.render.com                      ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
