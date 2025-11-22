import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

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

export const orderQueue = new Queue('order-execution', { connection: getRedisConnection() });
