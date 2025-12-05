import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateAdvanceRemaining } from '@/lib/calculations';
import { reimburseAdvanceSchema } from '@/lib/validations';
import { AdvanceStatus, MouvementType } from '@/types';
import { ZodError } from 'zod';

/**
 * POST /api/advances/[id]/reimburse
 * Create a reimbursement for an advance (Admin only)
 * Creates ENTREE Mouvement linked to advance and updates advance status
 */
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin authentication and get tenant
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        const advanceId = params.id;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = reimburseAdvanceSchema.parse(body);

        // Fetch the advance with reimbursements
        const advance = await prisma.advance.findFirst({
            where: {
                id: advanceId,
                tenantId, // CRITICAL: Verify advance belongs to tenant
            },
            include: {
                reimbursements: true,
                intervenant: true,
            },
        });

        if (!advance) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Advance not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Calculate remaining balance
        const remaining = calculateAdvanceRemaining(advance as any);

        // Validate reimbursement amount doesn't exceed remaining
        if (validatedData.amount > remaining) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: `Reimbursement amount (${validatedData.amount}) exceeds remaining balance (${remaining})`,
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Create reimbursement and update advance in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the ENTREE mouvement for the reimbursement
            const reimbursement = await tx.mouvement.create({
                data: {
                    tenantId,
                    date: new Date(validatedData.date),
                    intervenantId: advance.intervenantId,
                    type: MouvementType.ENTREE,
                    amount: validatedData.amount,
                    reference: validatedData.reference,
                    modality: 'ESPECES', // Default to cash for reimbursements
                    category: 'AVANCES_ASSOCIES',
                    note: validatedData.note,
                    advanceId: advance.id,
                },
            });

            // Calculate new remaining balance
            const newRemaining = remaining - validatedData.amount;

            // Determine new status
            let newStatus: AdvanceStatus;
            if (newRemaining === 0) {
                newStatus = AdvanceStatus.REMBOURSE_TOTAL;
            } else if (newRemaining < advance.amount) {
                newStatus = AdvanceStatus.REMBOURSE_PARTIEL;
            } else {
                newStatus = AdvanceStatus.EN_COURS;
            }

            // Update advance status
            const updatedAdvance = await tx.advance.update({
                where: { id: advance.id },
                data: { status: newStatus },
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
                        },
                    },
                    reimbursements: {
                        select: {
                            id: true,
                            date: true,
                            amount: true,
                            reference: true,
                            note: true,
                        },
                        orderBy: {
                            date: 'asc',
                        },
                    },
                },
            });

            return {
                advance: updatedAdvance,
                reimbursement,
            };
        });

        return NextResponse.json(result, { status: 201 });

    } catch (error) {
        // Handle validation errors
        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation error',
                    message: 'Invalid input data',
                    details: error.errors,
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        return handleAPIError(error);
    }
}
