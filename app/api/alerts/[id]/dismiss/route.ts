import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';

/**
 * POST /api/alerts/[id]/dismiss
 * Dismiss an alert
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;
        const userId = payload.userId;
        const alertId = params.id;

        // Verify alert exists and belongs to tenant
        const alert = await prisma.alert.findFirst({
            where: {
                id: alertId,
                tenantId,
            },
        });

        if (!alert) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Alert not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Update alert to dismissed
        const updatedAlert = await prisma.alert.update({
            where: {
                id: alertId,
            },
            data: {
                dismissed: true,
                dismissedAt: new Date(),
                dismissedBy: userId,
            },
        });

        return NextResponse.json(updatedAlert, { status: 200 });
    } catch (error) {
        return handleAPIError(error);
    }
}
