import { Connection, PublicKey } from '@solana/web3.js';

export interface QuoteRequest {
    inputToken: string;
    outputToken: string;
    amount: number; // Amount in UI units (e.g. 1.5 SOL)
    slippageBps: number;
}

export interface QuoteResponse {
    dex: 'RAYDIUM' | 'METEORA';
    price: number;
    outAmount: string; // Raw amount
    quoteData: any; // SDK specific quote object
    error?: string;
}

export interface DexAdapter {
    getQuote(connection: Connection, request: QuoteRequest): Promise<QuoteResponse>;
    getSwapTransaction(connection: Connection, quote: QuoteResponse, walletPublicKey: PublicKey): Promise<string>; // Returns base64 encoded transaction
}
