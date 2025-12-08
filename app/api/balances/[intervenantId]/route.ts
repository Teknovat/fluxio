import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateIntervenantBalance } from '@/lib/calculations';
import { IntervenantBalance, MouvementType } from '@/types';

/**
 * GET /api/balances/[intervenantId]
 * Fetch detailed balance for a specific intervenant
 * Returns balance data, movements, and outstanding advances
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { intervenantId: string } }
) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const { intervenantId } = params;

        // Verify intervenant exists and belongs to tenant
        const intervenant = await prisma.intervenant.findFirst({
            where: {
                id: intervenantId,
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

        // Fetch all movements for this intervenant
        const movements = await prisma.mouvement.findMany({
            where: {
                intervenantId,
                tenantId, // CRITICAL: Filter by tenant
            },
            orderBy: {
                date: 'desc',
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

        // Calculate balance
        const totalEntries = movements
            .filter((m) => m.type === MouvementType.ENTREE)
            .reduce((sum, m) => sum + m.amount, 0);

        const totalExits = movements
            .filter((m) => m.type === MouvementType.SORTIE)
            .reduce((sum, m) => sum + m.amount, 0);

        const balance = totalExits - totalEntries;

        const lastMovementDate = movements.length > 0 ? movements[0].date : undefined;

        const balanceData: IntervenantBalance = {
            intervenant: intervenant as any,
            totalEntries,
            totalExits,
            balance,
            movementCount: movements.length,
            lastMovementDate,
        };

        // Fetch all disbursements for this intervenant (including fully justified ones)
        const disbursements = await prisma.disbursement.findMany({
            where: {
                intervenantId,
                intervenant: {
                    tenantId, // CRITICAL: Filter by tenant through relation
                },
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
                mouvement: true,
                justifications: {
                    orderBy: {
                        date: 'desc',
                    },
                },
                returns: {
                    orderBy: {
                        date: 'desc',
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        // Return balance, movements, and disbursements
        return NextResponse.json(
            {
                balance: balanceData,
                movements,
                disbursements,
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
