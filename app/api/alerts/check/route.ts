import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { checkAndCreateAlerts } from '@/lib/alerts';

/**
 * POST /api/alerts/check
 * Manually trigger alert checking
 */
export async function POST(request: NextRequest) {
    try {
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const alerts = await checkAndCreateAlerts(prisma, tenantId);

        return NextResponse.json(
            {
                message: 'Alert check completed',
                alertsCreated: alerts.length,
                alerts,
            },
            { status: 200 }
        );
    } catch (error) {
        return handleAPIError(error);
    }
}
