import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateDisbursementRemaining } from '@/lib/disbursement-calculations';

/**
 * GET /api/disbursements/[id]
 * Fetch a single disbursement by ID with all relations and calculated totals
 * Verifies disbursement belongs to the authenticated user's tenant
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const { id } = params;

        // Fetch disbursement with all relations
        const disbursement = await prisma.disbursement.findFirst({
            where: {
                id,
                tenantId, // CRITICAL: Verify disbursement belongs to tenant
            },
            include: {
                intervenant: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        active: true,
                    },
                },
                mouvement: {
                    select: {
                        id: true,
                        date: true,
                        amount: true,
                        reference: true,
                        note: true,
                        type: true,
                        modality: true,
                    },
                },
                justifications: {
                    select: {
                        id: true,
                        date: true,
                        amount: true,
                        category: true,
                        reference: true,
                        note: true,
                        createdBy: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                    orderBy: {
                        date: 'asc',
                    },
                },
                returns: {
                    select: {
                        id: true,
                        date: true,
                        amount: true,
                        reference: true,
                        note: true,
                        type: true,
                        createdAt: true,
                    },
                    orderBy: {
                        date: 'asc',
                    },
                },
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

        // Calculate totals
        const totalJustified = disbursement.justifications.reduce(
            (sum: number, j: any) => sum + j.amount,
            0
        );
        const totalReturned = disbursement.returns.reduce(
            (sum: number, r: any) => sum + r.amount,
            0
        );
        const remaining = calculateDisbursementRemaining(disbursement as any);

        // Return disbursement with calculated totals
        return NextResponse.json(
            {
                ...disbursement,
                totalJustified,
                totalReturned,
                remaining,
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
