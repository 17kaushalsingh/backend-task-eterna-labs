import Redis, { RedisOptions } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const getRedisConfig = (): string | RedisOptions => {
    // Use REDIS_URL if available (Render provides this with TLS and auth)
    if (process.env.REDIS_URL) {
        return process.env.REDIS_URL;
    }
    // Fallback to host/port for local development
    return {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
    };
};

const redisConfig = getRedisConfig();

export const pubClient = new Redis(redisConfig as any);
export const subClient = new Redis(redisConfig as any);
