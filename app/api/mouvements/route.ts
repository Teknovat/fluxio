import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { createMouvementSchema } from '@/lib/validations';
import { ZodError } from 'zod';

/**
 * GET /api/mouvements
 * Fetch mouvements with optional filters (All authenticated users)
 * Returns mouvements array and summary object
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');
        const intervenantId = searchParams.get('intervenantId');
        const type = searchParams.get('type');
        const modalities = searchParams.getAll('modality');

        // Build Prisma query with filters - ALWAYS filter by tenantId
        const where: any = {
            tenantId, // CRITICAL: Filter by tenant
        };

        // Date range filter
        if (dateFrom || dateTo) {
            where.date = {};
            if (dateFrom) {
                where.date.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.date.lte = new Date(dateTo);
            }
        }

        // Intervenant filter
        if (intervenantId) {
            where.intervenantId = intervenantId;
        }

        // Type filter
        if (type && (type === 'ENTREE' || type === 'SORTIE')) {
            where.type = type;
        }

        // Modality filter - support multiple modalities
        if (modalities.length > 0) {
            const validModalities = modalities.filter(m =>
                ['ESPECES', 'CHEQUE', 'VIREMENT', 'AUTRE'].includes(m)
            );
            if (validModalities.length > 0) {
                where.modality = {
                    in: validModalities
                };
            }
        }

        // Fetch mouvements with intervenant data
        const mouvements = await prisma.mouvement.findMany({
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
            },
            orderBy: {
                date: 'desc',
            },
        });

        // Calculate summary
        let totalEntree = 0;
        let totalSortie = 0;

        mouvements.forEach((mouvement) => {
            if (mouvement.type === 'ENTREE') {
                totalEntree += mouvement.amount;
            } else if (mouvement.type === 'SORTIE') {
                totalSortie += mouvement.amount;
            }
        });

        const solde = totalEntree - totalSortie;

        // Return mouvements and summary
        return NextResponse.json(
            {
                mouvements,
                summary: {
                    totalEntree,
                    totalSortie,
                    solde,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * POST /api/mouvements
 * Create a new mouvement (Admin only)
 * Validates input, verifies intervenant exists and is active
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication and get tenant
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createMouvementSchema.parse(body);

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
                    message: 'Cannot create mouvement for inactive intervenant',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Create mouvement in database with tenantId
        const newMouvement = await prisma.mouvement.create({
            data: {
                tenantId, // CRITICAL: Set tenant
                date: new Date(validatedData.date),
                intervenantId: validatedData.intervenantId,
                type: validatedData.type,
                amount: validatedData.amount,
                reference: validatedData.reference,
                modality: validatedData.modality,
                note: validatedData.note,
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
            },
        });

        return NextResponse.json(newMouvement, { status: 201 });

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
