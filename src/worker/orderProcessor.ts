import { Worker, Job } from 'bullmq';
import { PrismaClient } from '@prisma/client';
import { DexRouter } from '../dex/router';
import { connection, getWallet } from '../utils/solana';
import { QuoteRequest } from '../dex/types';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const router = new DexRouter();
const redisConnection = {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
};

// Mock function to simulate WebSocket updates (will be replaced by actual WS logic)
const updateStatus = async (orderId: string, status: string, data?: any) => {
    console.log(`[Order ${orderId}] Status: ${status}`, data || '');
    // In a real app, we would publish to Redis Pub/Sub here for the WS server to pick up
    await prisma.order.update({
        where: { id: orderId },
        data: {
            status,
            logs: data ? [JSON.stringify(data)] : undefined,
            txHash: data?.txHash
        },
    });
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

export const orderWorker = new Worker('order-execution', processOrder, {
    connection: redisConnection,
    concurrency: 10, // Requirement: Queue system managing up to 10 concurrent orders
    limiter: {
        max: 100, // Requirement: Process 100 orders/minute
        duration: 60000
    }
});

orderWorker.on('completed', job => {
    console.log(`Job ${job.id} has completed!`);
});

orderWorker.on('failed', (job, err) => {
    console.log(`Job ${job?.id} has failed with ${err.message}`);
});
