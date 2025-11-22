import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { DexRouter } from '../dex/router';
import { connection, getWallet } from '../utils/solana';
import { QuoteRequest } from '../dex/types';
import { pubClient } from '../utils/redis';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const router = new DexRouter();

const getRedisConnection = () => {
    // Use REDIS_URL if available (Render provides this with TLS and auth)
    if (process.env.REDIS_URL) {
        return new IORedis(process.env.REDIS_URL, { maxRetriesPerRequest: null });
    }
    // Fallback to host/port for local development
    return new IORedis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
        maxRetriesPerRequest: null,
    });
};

// Mock function to simulate WebSocket updates (will be replaced by actual WS logic)
const updateStatus = async (orderId: string, status: string, data?: any) => {
    console.log(`[Order ${orderId}] Status: ${status}`, data || '');

    try {
        // CRITICAL: Update DB FIRST, then publish to Redis
        // This ensures data consistency - if DB fails, Redis never gets the wrong state
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            select: { logs: true }
        });

        const currentLogs = Array.isArray(order?.logs) ? order.logs : [];
        const newLog = data ? JSON.stringify({ status, timestamp: new Date().toISOString(), ...data }) : JSON.stringify({ status, timestamp: new Date().toISOString() });

        await prisma.order.update({
            where: { id: orderId },
            data: {
                status,
                logs: [...currentLogs, newLog],
                txHash: data?.txHash || undefined
            },
        });

        // Only publish to Redis if DB update succeeded
        const payload = { orderId, status, data };
        await pubClient.publish(`order-updates:${orderId}`, JSON.stringify(payload));

        console.log(`[Order ${orderId}] Status updated successfully in DB and published to Redis`);
    } catch (error: any) {
        console.error(`[Order ${orderId}] CRITICAL: Failed to update status to ${status}:`, error.message);
        // Don't throw - let the calling function handle the error
        // This prevents recursive error handling issues
        throw new Error(`Status update failed for order ${orderId}: ${error.message}`);
    }
};

const processOrder = async (job: Job) => {
    const { orderId, inputToken, outputToken, amount } = job.data;
    const wallet = getWallet();

    try {
        await updateStatus(orderId, 'ROUTING');

        const request: QuoteRequest = {
            inputToken,
            outputToken,
            amount: parseFloat(amount),
            slippageBps: 50, // 0.5%
        };

        const bestQuote = await router.getBestQuote(connection, request);
        await updateStatus(orderId, 'BUILDING', { dex: bestQuote.dex, price: bestQuote.price });

        const tx = await router.getTransaction(connection, bestQuote, wallet.publicKey);

        await updateStatus(orderId, 'SUBMITTED');

        // In a real scenario, we would sign and send the transaction here.
        // const signature = await connection.sendTransaction(tx, [wallet]);
        // await connection.confirmTransaction(signature);

        // Mocking success for now
        const mockSignature = 'mock_tx_hash_' + Date.now();

        await updateStatus(orderId, 'CONFIRMED', { txHash: mockSignature, price: bestQuote.price });

        return { status: 'CONFIRMED', txHash: mockSignature };

    } catch (error: any) {
        console.error(`Order ${orderId} failed:`, error);
        await updateStatus(orderId, 'FAILED', { error: error.message });
        throw error;
    }
};

const redisConnection = getRedisConnection();
console.log('Initializing Worker with Redis connection');

export const orderWorker = new Worker('order-execution', processOrder, {
    connection: redisConnection,
    concurrency: 10, // Requirement: Queue system managing up to 10 concurrent orders
    limiter: {
        max: 100, // Requirement: Process 100 orders/minute
        duration: 60000
    },
    settings: {
        // Add retry configuration for failed jobs
        backoffStrategy: (attemptsMade: number) => {
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            return Math.min(Math.pow(2, attemptsMade) * 1000, 30000);
        }
    }
});

orderWorker.on('ready', () => {
    console.log('✅ Worker is ready and connected to Redis');
});

orderWorker.on('completed', job => {
    console.log(`✅ Job ${job.id} has completed!`);
});

orderWorker.on('failed', (job, err) => {
    console.error(`❌ Job ${job?.id} has failed with ${err.message}`);
    console.error('Job data:', job?.data);
});

orderWorker.on('error', err => {
    console.error('❌ Worker error:', err);
});

orderWorker.on('stalled', (jobId) => {
    console.warn(`⚠️  Job ${jobId} has stalled`);
});
