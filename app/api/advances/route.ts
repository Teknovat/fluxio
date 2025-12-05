import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateAdvanceRemaining } from '@/lib/calculations';
import { createAdvanceSchema } from '@/lib/validations';
import { AdvanceStatus, MouvementType } from '@/types';
import { ZodError } from 'zod';

/**
 * GET /api/advances
 * Fetch all advances with optional filters
 * Returns advances array with calculated remaining balances
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

        // Build Prisma query with filters - ALWAYS filter by tenantId
        const where: any = {
            tenantId, // CRITICAL: Filter by tenant
        };

        // Status filter
        if (status && ['EN_COURS', 'REMBOURSE_PARTIEL', 'REMBOURSE_TOTAL'].includes(status)) {
            where.status = status;
        }

        // Intervenant filter
        if (intervenantId) {
            where.intervenantId = intervenantId;
        }

        // Date range filter
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.createdAt.lte = new Date(dateTo);
            }
        }

        // Fetch advances with related data
        const advances = await prisma.advance.findMany({
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
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Calculate remaining balance for each advance
        const advancesWithRemaining = advances.map((advance) => {
            const remaining = calculateAdvanceRemaining(advance as any);
            return {
                ...advance,
                remaining,
            };
        });

        return NextResponse.json(advancesWithRemaining, { status: 200 });

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * POST /api/advances
 * Create a new advance (Admin only)
 * Creates both Advance record and associated SORTIE Mouvement
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication and get tenant
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createAdvanceSchema.parse(body);

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
                    message: 'Cannot create advance for inactive intervenant',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Get settings to determine default due date if not provided
        let dueDate: Date | undefined;
        if (validatedData.dueDate) {
            dueDate = new Date(validatedData.dueDate);
        } else {
            // Fetch settings for default due date
            const settings = await prisma.settings.findUnique({
                where: { tenantId },
            });

            if (settings && settings.defaultAdvanceDueDays > 0) {
                dueDate = new Date(validatedData.date);
                dueDate.setDate(dueDate.getDate() + settings.defaultAdvanceDueDays);
            }
        }

        // Create advance and associated mouvement in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create the SORTIE mouvement for the advance
            const mouvement = await tx.mouvement.create({
                data: {
                    tenantId,
                    date: new Date(validatedData.date),
                    intervenantId: validatedData.intervenantId,
                    type: MouvementType.SORTIE,
                    amount: validatedData.amount,
                    modality: 'ESPECES', // Default to cash for advances
                    category: 'AVANCES_ASSOCIES',
                    note: validatedData.note,
                    isAdvance: true,
                },
            });

            // Create the advance record
            const advance = await tx.advance.create({
                data: {
                    tenantId,
                    mouvementId: mouvement.id,
                    intervenantId: validatedData.intervenantId,
                    amount: validatedData.amount,
                    dueDate,
                    status: AdvanceStatus.EN_COURS,
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
                    reimbursements: true,
                },
            });

            return advance;
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
