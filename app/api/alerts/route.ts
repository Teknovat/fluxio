import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';

/**
 * GET /api/alerts
 * Fetch alerts for the tenant with optional filters
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const { searchParams } = new URL(request.url);
        const dismissed = searchParams.get('dismissed');
        const type = searchParams.get('type');

        const where: any = {
            tenantId,
        };

        if (dismissed !== null) {
            where.dismissed = dismissed === 'true';
        }

        if (type) {
            where.type = type;
        }

        const alerts = await prisma.alert.findMany({
            where,
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(alerts, { status: 200 });
    } catch (error) {
        return handleAPIError(error);
    }
}
