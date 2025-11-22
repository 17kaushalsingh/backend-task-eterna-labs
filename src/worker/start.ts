import { orderWorker } from './orderProcessor';

console.log('🚀 Starting worker...', orderWorker.name);

// Wait for worker to be ready before confirming startup
let isReady = false;

orderWorker.on('ready', () => {
    isReady = true;
    console.log('✅ Worker is fully operational and processing jobs');
});

// Verify connection after 5 seconds
setTimeout(() => {
    if (!isReady) {
        console.error('❌ CRITICAL: Worker failed to connect to Redis after 5 seconds');
        console.error('❌ Check your Redis connection settings in .env');
        console.error('❌ Orders will NOT be processed until this is fixed!');
    }
}, 5000);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
    console.log('⚠️  SIGTERM received, shutting down gracefully...');
    await orderWorker.close();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('⚠️  SIGINT received, shutting down gracefully...');
    await orderWorker.close();
    process.exit(0);
});

// Keep process alive
setInterval(() => { }, 1000);
