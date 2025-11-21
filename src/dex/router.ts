import { Connection, PublicKey } from '@solana/web3.js';
import { DexAdapter, QuoteRequest, QuoteResponse } from './types';
import { RaydiumAdapter } from './raydium';
import { MeteoraAdapter } from './meteora';

export class DexRouter {
    private adapters: DexAdapter[];

    constructor() {
        this.adapters = [new RaydiumAdapter(), new MeteoraAdapter()];
    }

    async getBestQuote(connection: Connection, request: QuoteRequest): Promise<QuoteResponse> {
        const quotes = await Promise.all(
            this.adapters.map(adapter => adapter.getQuote(connection, request))
        );

        // Filter out failed quotes
        const validQuotes = quotes.filter(q => !q.error && parseFloat(q.outAmount) > 0);

        if (validQuotes.length === 0) {
            throw new Error('No valid quotes found');
        }

        // Sort by outAmount descending (best price)
        validQuotes.sort((a, b) => parseFloat(b.outAmount) - parseFloat(a.outAmount));

        return validQuotes[0];
    }

    async getTransaction(connection: Connection, quote: QuoteResponse, walletPublicKey: PublicKey): Promise<string> {
        const adapter = quote.dex === 'RAYDIUM' ? new RaydiumAdapter() : new MeteoraAdapter();
        return adapter.getSwapTransaction(connection, quote, walletPublicKey);
    }
}
