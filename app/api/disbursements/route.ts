import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateDisbursementRemaining } from '@/lib/disbursement-calculations';
import { MouvementType } from '@/types';
import { ZodError } from 'zod';
import { z } from 'zod';

/**
 * GET /api/disbursements
 * Fetch disbursements with optional filters (All authenticated users)
 * Returns disbursements array with calculated remaining amounts
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const intervenantId = searchParams.get('intervenantId');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const category = searchParams.get('category');

        // Build Prisma query with filters - ALWAYS filter by tenantId
        const where: any = {
            tenantId, // CRITICAL: Filter by tenant
        };

        // Status filter
        if (status && ['OPEN', 'PARTIALLY_JUSTIFIED', 'JUSTIFIED'].includes(status)) {
            where.status = status;
        }

        // Intervenant filter
        if (intervenantId) {
            where.intervenantId = intervenantId;
        }

        // Date range filter (based on mouvement date)
        if (dateFrom || dateTo) {
            where.mouvement = {};
            if (dateFrom || dateTo) {
                where.mouvement.date = {};
                if (dateFrom) {
                    where.mouvement.date.gte = new Date(dateFrom);
                }
                if (dateTo) {
                    where.mouvement.date.lte = new Date(dateTo);
                }
            }
        }

        // Category filter
        if (category && ['STOCK_PURCHASE', 'BANK_DEPOSIT', 'SALARY_ADVANCE', 'GENERAL_EXPENSE', 'CAISSE_END_DAY', 'OTHER'].includes(category)) {
            where.category = category;
        }

        // Fetch disbursements with all relations
        const disbursements = await prisma.disbursement.findMany({
            where,
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
                    },
                    orderBy: {
                        date: 'asc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate remaining amount for each disbursement
        const disbursementsWithRemaining = disbursements.map((disbursement: any) => ({
            ...disbursement,
            remaining: calculateDisbursementRemaining(disbursement),
        }));

        return NextResponse.json(disbursementsWithRemaining, { status: 200 });

    } catch (error) {
        return handleAPIError(error);
    }
}

// Validation schema for creating a disbursement
const createDisbursementSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    intervenantId: z.string().min(1, 'Intervenant is required'),
    amount: z.number().positive('Amount must be greater than zero'),
    category: z.enum(['STOCK_PURCHASE', 'BANK_DEPOSIT', 'SALARY_ADVANCE', 'GENERAL_EXPENSE', 'CAISSE_END_DAY', 'OTHER']),
    dueDate: z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), {
        message: 'Invalid due date format',
    }),
    note: z.string().optional(),
});

/**
 * POST /api/disbursements
 * Create a new disbursement (Admin only)
 * Creates both a Disbursement record and a SORTIE Mouvement
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication and get tenant
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createDisbursementSchema.parse(body);

        // Verify intervenant exists, is active, AND belongs to the same tenant
        const intervenant = await prisma.intervenant.findFirst({
            where: {
                id: validatedData.intervenantId,
                tenantId, // CRITICAL: Verify intervenant belongs to tenant
            },
        });

        if (!intervenant) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Intervenant not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        if (!intervenant.active) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Cannot create disbursement for inactive intervenant',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Create disbursement and mouvement in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the SORTIE mouvement first
            const mouvement = await tx.mouvement.create({
                data: {
                    tenantId,
                    date: new Date(validatedData.date),
                    intervenantId: validatedData.intervenantId,
                    type: MouvementType.SORTIE,
                    amount: validatedData.amount,
                    modality: 'ESPECES', // Default to cash for disbursements
                    category: 'AVANCES_ASSOCIES', // Default category
                    note: validatedData.note,
                },
            });

            // Create the disbursement record
            const disbursement = await tx.disbursement.create({
                data: {
                    tenantId,
                    mouvementId: mouvement.id,
                    intervenantId: validatedData.intervenantId,
                    initialAmount: validatedData.amount,
                    remainingAmount: validatedData.amount,
                    status: 'OPEN',
                    category: validatedData.category,
                    dueDate: validatedData.dueDate ? new Date(validatedData.dueDate) : undefined,
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
                        },
                    },
                    justifications: true,
                    returns: true,
                },
            });

            return disbursement;
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
