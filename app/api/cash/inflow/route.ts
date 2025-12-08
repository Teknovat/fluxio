import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { MouvementType, Modality } from '@/types';
import { ZodError, z } from 'zod';
import { clearBalanceCache } from '@/lib/cash-balance-cache';

// Validation schema for creating a cash inflow
const createCashInflowSchema = z.object({
    date: z.string().refine((val) => !isNaN(Date.parse(val)), {
        message: 'Invalid date format',
    }),
    amount: z.number().positive('Amount must be greater than zero'),
    category: z.string().min(1, 'Category is required'),
    intervenantId: z.string().optional(),
    reference: z.string().optional(),
    note: z.string().optional(),
});

/**
 * POST /api/cash/inflow
 * Create a new cash inflow movement (Admin only)
 * Creates an ENTREE Mouvement with modality ESPECES
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication and get tenant
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createCashInflowSchema.parse(body);

        // If intervenantId is provided, verify it exists and belongs to tenant
        if (validatedData.intervenantId) {
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
                        message: 'Cannot create movement for inactive intervenant',
                        statusCode: 400,
                    },
                    { status: 400 }
                );
            }
        } else {
            // If no intervenant provided, we need to find or create a default one
            // For cash inflows without a specific intervenant, use a default "Caisse" intervenant
            let defaultIntervenant = await prisma.intervenant.findFirst({
                where: {
                    tenantId,
                    type: 'CAISSE_BANQUE',
                    name: 'Caisse',
                },
            });

            if (!defaultIntervenant) {
                // Create default intervenant if it doesn't exist
                defaultIntervenant = await prisma.intervenant.create({
                    data: {
                        tenantId,
                        name: 'Caisse',
                        type: 'CAISSE_BANQUE',
                        active: true,
                        notes: 'Intervenant par défaut pour les mouvements de caisse',
                    },
                });
            }

            validatedData.intervenantId = defaultIntervenant.id;
        }

        // Create the ENTREE mouvement with ESPECES modality
        const mouvement = await prisma.mouvement.create({
            data: {
                tenantId,
                date: new Date(validatedData.date),
                intervenantId: validatedData.intervenantId!,
                type: MouvementType.ENTREE,
                amount: validatedData.amount,
                modality: Modality.ESPECES, // Always ESPECES for cash inflows
                category: validatedData.category,
                reference: validatedData.reference,
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

        // Clear the balance cache since we've added a new movement
        clearBalanceCache(tenantId);

        return NextResponse.json(mouvement, { status: 201 });

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
