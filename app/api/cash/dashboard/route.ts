import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import {
    calculateCurrentCashBalance,
    getTodayCashSummary,
    getRecentCashMovements,
    calculateCashBalanceTrend,
} from '@/lib/cash-calculations';
import { CashDashboardData, DisbursementStatus } from '@/types';

/**
 * GET /api/cash/dashboard
 * Fetch comprehensive cash dashboard data
 * Returns current balance, today's summary, recent movements, balance trend, and alerts
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Calculate current cash balance
        const currentBalance = await calculateCurrentCashBalance(prisma, tenantId);

        // Calculate today's inflows, outflows, and net change
        const todaySummary = await getTodayCashSummary(prisma, tenantId);

        // Fetch recent movements (last 20)
        const recentMovements = await getRecentCashMovements(prisma, tenantId, 20);

        // Calculate balance trend (last 30 days)
        const balanceTrend = await calculateCashBalanceTrend(prisma, tenantId, 30);

        // Calculate outstanding disbursements
        const disbursements = await (prisma as any).disbursement.findMany({
            where: {
                tenantId,
                status: {
                    in: [DisbursementStatus.OPEN, DisbursementStatus.PARTIALLY_JUSTIFIED],
                },
            },
        });

        const outstandingDisbursements = disbursements.reduce(
            (sum: number, d: any) => sum + d.remainingAmount,
            0
        );

        // Fetch active alerts
        const alerts = await (prisma as any).alert.findMany({
            where: {
                tenantId,
                dismissed: false,
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 10,
        });

        // Construct dashboard data
        const dashboardData: CashDashboardData = {
            currentBalance,
            todayInflows: todaySummary.inflows,
            todayOutflows: todaySummary.outflows,
            netChangeToday: todaySummary.net,
            recentMovements,
            balanceTrend,
            outstandingDisbursements,
            alerts,
        };

        return NextResponse.json(dashboardData, { status: 200 });

    } catch (error) {
        return handleAPIError(error);
    }
}
