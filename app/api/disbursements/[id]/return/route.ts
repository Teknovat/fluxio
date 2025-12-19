import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateDisbursementRemaining } from '@/lib/disbursement-calculations';
import { MouvementType } from '@/types';
import { subtractMoney } from '@/lib/number-utils';

/**
 * POST /api/disbursements/[id]/return
 * Record a return to cash for a disbursement
 * This DOES create a cash movement (ENTREE) - physical money coming back
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 11.3, 11.5
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant (Requirement 11.3, 11.5)
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const { id } = params;

        // Parse and validate request body (Requirement 3.7)
        const body = await request.json();
        const { date, amount, reference, note } = body;

        // Validate required fields
        if (!date || !amount) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Missing required fields: date, amount',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Validate amount is positive
        if (amount <= 0) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Amount must be greater than zero',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Verify disbursement exists and belongs to tenant (Requirement 11.5)
        const disbursement = await prisma.disbursement.findFirst({
            where: {
                id,
                tenantId,
            },
            include: {
                justifications: true,
                returns: true,
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

        // Calculate current remaining amount
        const currentRemaining = calculateDisbursementRemaining(disbursement as any);

        // Validate amount does not exceed remaining (Requirement 3.4)
        if (amount > currentRemaining) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: `Return amount (${amount}) exceeds remaining amount (${currentRemaining})`,
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Create ENTREE Mouvement linked to disbursement (Requirement 3.1, 3.3, 3.8)
        const movement = await prisma.mouvement.create({
            data: {
                tenantId,
                date: new Date(date),
                intervenantId: disbursement.intervenantId,
                type: MouvementType.ENTREE,
                amount,
                reference: reference || null,
                note: note || null,
                modality: 'ESPECES', // Returns are always cash
                category: 'AVANCES_ASSOCIES', // Category for disbursement returns
                disbursementId: id,
            },
        });

        // Calculate new remaining amount (Requirement 3.2)
        const newRemaining = subtractMoney(currentRemaining, amount);

        // Determine new status (Requirement 3.5)
        const newStatus = newRemaining === 0
            ? 'JUSTIFIED'
            : newRemaining < disbursement.initialAmount
                ? 'PARTIALLY_JUSTIFIED'
                : 'OPEN';

        // Update disbursement remainingAmount and status (Requirement 3.2, 3.5)
        const updatedDisbursement = await prisma.disbursement.update({
            where: { id },
            data: {
                remainingAmount: newRemaining,
                status: newStatus,
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

        // Calculate totals for response
        const totalJustified = updatedDisbursement.justifications.reduce(
            (sum: number, j: any) => sum + j.amount,
            0
        );
        const totalReturned = updatedDisbursement.returns.reduce(
            (sum: number, r: any) => sum + r.amount,
            0
        );

        // Return updated disbursement and movement (Requirement 3.9, 3.10)
        return NextResponse.json(
            {
                disbursement: {
                    ...updatedDisbursement,
                    totalJustified,
                    totalReturned,
                    remaining: newRemaining,
                },
                movement,
            },
            { status: 201 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
