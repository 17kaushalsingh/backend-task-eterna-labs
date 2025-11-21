import { Connection, Keypair } from '@solana/web3.js';
import dotenv from 'dotenv';
import bs58 from 'bs58';

dotenv.config();

export const connection = new Connection(process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com', 'confirmed');

export const getWallet = (): Keypair => {
    const privateKeyString = process.env.PRIVATE_KEY;
    if (!privateKeyString) {
        throw new Error('PRIVATE_KEY not found in .env');
    }

    try {
        // Try parsing as JSON array
        const secretKey = Uint8Array.from(JSON.parse(privateKeyString));
        return Keypair.fromSecretKey(secretKey);
    } catch (e) {
        // Try decoding as base58
        try {
            const secretKey = bs58.decode(privateKeyString);
            return Keypair.fromSecretKey(secretKey);
        } catch (e2) {
            throw new Error('Invalid PRIVATE_KEY format. Must be JSON array or Base58 string.');
        }
    }
};
