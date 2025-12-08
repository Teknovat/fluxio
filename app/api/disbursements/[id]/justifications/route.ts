import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';

/**
 * GET /api/disbursements/[id]/justifications
 * Fetch all justifications for a disbursement
 * Requirements: 2.10, 5.3, 11.5
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant (Requirement 11.5)
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const { id } = params;

        // Verify disbursement exists and belongs to tenant (Requirement 11.5)
        const disbursement = await prisma.disbursement.findFirst({
            where: {
                id,
                tenantId,
            },
            select: {
                id: true,
            },
        });

        if (!disbursement) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Disbursement not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Fetch all justifications for the disbursement (Requirement 2.10, 5.3)
        const justifications = await prisma.justification.findMany({
            where: {
                disbursementId: id,
                tenantId, // Additional security check
            },
            select: {
                id: true,
                date: true,
                amount: true,
                category: true,
                reference: true,
                note: true,
                attachments: true,
                createdBy: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                date: 'asc', // Sort by date ascending (Requirement 5.3)
            },
        });

        return NextResponse.json(justifications, { status: 200 });

    } catch (error) {
        return handleAPIError(error);
    }
}
