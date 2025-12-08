import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateCurrentCashBalance } from '@/lib/cash-calculations';
import { getCachedBalance, setCachedBalance } from '@/lib/cash-balance-cache';

/**
 * GET /api/cash/balance
 * Get current cash balance with caching (5-minute TTL)
 * Returns balance and lastUpdated timestamp
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Check cache first
        const cached = getCachedBalance(tenantId);
        if (cached) {
            return NextResponse.json(
                {
                    balance: cached.balance,
                    lastUpdated: cached.lastUpdated,
                    cached: true,
                },
                { status: 200 }
            );
        }

        // Calculate fresh balance
        const balance = await calculateCurrentCashBalance(prisma, tenantId);
        const lastUpdated = new Date();

        // Store in cache
        setCachedBalance(tenantId, balance);

        return NextResponse.json(
            {
                balance,
                lastUpdated,
                cached: false,
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
