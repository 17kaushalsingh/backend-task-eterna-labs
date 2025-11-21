import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkOrders() {
    try {
        console.log('📊 Fetching all orders...\n');

        const orders = await prisma.order.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 10
        });

        if (orders.length === 0) {
            console.log('No orders found in database.');
            return;
        }

        console.log(`Found ${orders.length} orders:\n`);

        orders.forEach((order, index) => {
            console.log(`${index + 1}. Order ID: ${order.id}`);
            console.log(`   Status: ${order.status}`);
            console.log(`   Type: ${order.type}`);
            console.log(`   Pair: ${order.inputToken} → ${order.outputToken}`);
            console.log(`   Amount: ${order.amount}`);
            console.log(`   TX Hash: ${order.txHash || 'N/A'}`);
            console.log(`   Created: ${order.createdAt}`);
            console.log(`   Logs: ${JSON.stringify(order.logs, null, 2)}`);
            if (order.error) {
                console.log(`   Error: ${order.error}`);
            }
            console.log('');
        });

        // Count by status
        const statusCounts = await prisma.order.groupBy({
            by: ['status'],
            _count: {
                status: true
            }
        });

        console.log('\n📈 Status Summary:');
        statusCounts.forEach(({ status, _count }) => {
            console.log(`   ${status}: ${_count.status}`);
        });

    } catch (error) {
        console.error('Error checking orders:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrders();
