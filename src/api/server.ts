import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import cors from '@fastify/cors';
import { PrismaClient } from '@prisma/client';
import { orderQueue } from '../queue/orderQueue';
import { subClient } from '../utils/redis';
import fastifyStatic from '@fastify/static';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const fastify = Fastify({ logger: true });
const prisma = new PrismaClient();

fastify.register(cors);
fastify.register(websocket);
fastify.register(fastifyStatic, {
    root: path.join(__dirname, '../../public'),
    prefix: '/', // optional: default '/'
});

// POST /api/orders/execute
fastify.post('/api/orders/execute', async (request, reply) => {
    const { inputToken, outputToken, amount } = request.body as any;

    if (!inputToken || !outputToken || !amount) {
        return reply.status(400).send({ error: 'Missing required fields' });
    }

    const order = await prisma.order.create({
        data: {
            type: 'MARKET',
            inputToken,
            outputToken,
            amount: amount.toString(),
            status: 'PENDING',
        },
    });

    await orderQueue.add('execute-order', {
        orderId: order.id,
        inputToken,
        outputToken,
        amount,
    });

    return { orderId: order.id, status: 'PENDING' };
});

// WebSocket /api/orders/ws
fastify.register(async function (fastify) {
    fastify.get('/api/orders/ws', { websocket: true }, (connection, req) => {
        console.log('Client connected to WebSocket');

        // Expect client to send orderId to subscribe
        connection.on('message', async (message: any) => {
            try {
                const { orderId } = JSON.parse(message.toString());
                if (orderId) {
                    console.log(`Subscribing to updates for order ${orderId}`);

                    // CRITICAL FIX: Get current status FIRST, before subscribing
                    // This ensures we send the most recent state to the client
                    const order = await prisma.order.findUnique({
                        where: { id: orderId },
                        select: { status: true, txHash: true, logs: true }
                    });

                    if (!order) {
                        connection.send(JSON.stringify({ orderId, error: 'Order not found' }));
                        return;
                    }

                    // Subscribe to Redis channel for this order
                    const channel = `order-updates:${orderId}`;
                    const subscriber = subClient.duplicate();

                    await subscriber.connect();
                    await subscriber.subscribe(channel);

                    subscriber.on('message', (ch, msg) => {
                        if (ch === channel) {
                            console.log(`Forwarding update to client for order ${orderId}`);
                            connection.send(msg);
                        }
                    });

                    // Send current status with full history after subscribing
                    // This prevents race condition where updates come in before initial send
                    connection.send(JSON.stringify({
                        orderId,
                        status: order.status,
                        txHash: order.txHash,
                        logs: order.logs
                    }));

                    // Cleanup on close
                    connection.on('close', () => {
                        console.log(`Client disconnected from order ${orderId}`);
                        subscriber.unsubscribe();
                        subscriber.quit();
                    });
                }
            } catch (e) {
                console.error('WebSocket message error:', e);
                connection.send(JSON.stringify({ error: 'Failed to subscribe to order updates' }));
            }
        });
    });
});

const start = async () => {
    try {
        await fastify.listen({ port: parseInt(process.env.PORT || '3000'), host: '0.0.0.0' });
        console.log(`Server listening on ${process.env.PORT || 3000}`);
    } catch (err) {
        fastify.log.error(err);
        process.exit(1);
    }
};

start();
