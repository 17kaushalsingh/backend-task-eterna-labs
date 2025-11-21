import { orderWorker } from './orderProcessor';

console.log('Worker started...', orderWorker.name);

// Keep process alive
setInterval(() => { }, 1000);
