import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateAllBalances } from '@/lib/calculations';
import { BalanceSummary } from '@/types';

/**
 * GET /api/balances
 * Fetch balances for all intervenants with optional filters
 * Returns balances array and summary object
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build filters object
        const filters: {
            type?: string;
            dateFrom?: Date;
            dateTo?: Date;
        } = {};

        if (type) {
            filters.type = type;
        }

        if (dateFrom) {
            filters.dateFrom = new Date(dateFrom);
        }

        if (dateTo) {
            filters.dateTo = new Date(dateTo);
        }

        // Calculate balances for all intervenants
        const balances = await calculateAllBalances(prisma, tenantId, filters);

        // Calculate summary
        const summary: BalanceSummary = {
            totalOwedToCompany: 0,
            totalCompanyOwes: 0,
            netBalance: 0,
        };

        balances.forEach((balance) => {
            if (balance.balance > 0) {
                // Positive balance = intervenant owes company
                summary.totalOwedToCompany += balance.balance;
            } else if (balance.balance < 0) {
                // Negative balance = company owes intervenant
                summary.totalCompanyOwes += Math.abs(balance.balance);
            }
        });

        summary.netBalance = summary.totalOwedToCompany - summary.totalCompanyOwes;

        // Return balances and summary
        return NextResponse.json(
            {
                balances,
                summary,
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
