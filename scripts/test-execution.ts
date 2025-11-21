import axios from 'axios';
import WebSocket from 'ws';

const API_URL = 'http://localhost:3000';
const WS_URL = 'ws://localhost:3000/api/orders/ws';

async function runTest() {
    try {
        console.log('1. Submitting Order...');
        const response = await axios.post(`${API_URL}/api/orders/execute`, {
            inputToken: 'SOL',
            outputToken: 'USDC',
            amount: 0.1
        });

        const { orderId } = response.data;
        console.log(`Order Submitted: ${orderId}`);

        console.log('2. Connecting to WebSocket...');
        const ws = new WebSocket(WS_URL);

        ws.on('open', () => {
            console.log('WebSocket Connected');
            // Subscribe
            ws.send(JSON.stringify({ orderId }));
        });

        ws.on('message', (data) => {
            const msg = JSON.parse(data.toString());
            console.log(`[WS Update] Status: ${msg.status} | Tx: ${msg.txHash || 'N/A'}`);

            if (msg.status === 'CONFIRMED' || msg.status === 'FAILED') {
                console.log('Final State Reached. Test Complete.');
                ws.close();
                process.exit(0);
            }
        });

        ws.on('error', (err) => {
            console.error('WebSocket Error:', err);
        });

        // Keep alive
        setInterval(() => { }, 1000);

    } catch (error: any) {
        console.error('Test Failed:', error.response ? JSON.stringify(error.response.data) : error.message);
    }
}

runTest();
