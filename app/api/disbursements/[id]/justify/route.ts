import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateDisbursementRemaining, determineDisbursementStatus } from '@/lib/disbursement-calculations';
import { JustificationCategory } from '@/types';

/**
 * POST /api/disbursements/[id]/justify
 * Add a justification to a disbursement
 * This does NOT create a cash movement - only documents how funds were used
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 11.2, 11.5
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant (Requirement 11.2, 11.5)
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;
        const userId = payload.userId;

        const { id } = params;

        // Parse and validate request body (Requirement 2.4)
        const body = await request.json();
        const { date, amount, category, reference, note } = body;

        // Validate required fields
        if (!date || !amount || !category) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Missing required fields: date, amount, category',
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

        // Validate category is valid
        if (!Object.values(JustificationCategory).includes(category)) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: `Invalid category. Must be one of: ${Object.values(JustificationCategory).join(', ')}`,
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

        // Validate amount does not exceed remaining (Requirement 2.5)
        if (amount > currentRemaining) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: `Justification amount (${amount}) exceeds remaining amount (${currentRemaining})`,
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Create justification record (NO movement) (Requirement 2.1, 2.2, 2.3)
        const justification = await prisma.justification.create({
            data: {
                tenantId,
                disbursementId: id,
                date: new Date(date),
                amount,
                category,
                reference: reference || null,
                note: note || null,
                createdBy: userId,
            },
        });

        // Calculate new remaining amount (Requirement 2.3)
        const newRemaining = currentRemaining - amount;

        // Determine new status (Requirement 2.6, 2.7)
        const newStatus = newRemaining === 0
            ? 'JUSTIFIED'
            : newRemaining < disbursement.initialAmount
                ? 'PARTIALLY_JUSTIFIED'
                : 'OPEN';

        // Update disbursement remainingAmount and status (Requirement 2.3, 2.6, 2.7)
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

        // Return updated disbursement and justification (Requirement 2.10)
        return NextResponse.json(
            {
                disbursement: {
                    ...updatedDisbursement,
                    totalJustified,
                    totalReturned,
                    remaining: newRemaining,
                },
                justification,
            },
            { status: 201 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
