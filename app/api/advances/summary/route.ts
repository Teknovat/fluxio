import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateAdvanceRemaining } from '@/lib/calculations';

/**
 * GET /api/advances/summary
 * Calculate summary statistics for advances
 * Returns total advances given, total reimbursed, and total outstanding
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Fetch all advances with reimbursements
        const advances = await prisma.advance.findMany({
            where: {
                tenantId, // CRITICAL: Filter by tenant
            },
            include: {
                reimbursements: {
                    select: {
                        amount: true,
                    },
                },
            },
        });

        // Calculate summary statistics
        let totalAdvances = 0;
        let totalReimbursed = 0;
        let totalOutstanding = 0;

        advances.forEach((advance) => {
            totalAdvances += advance.amount;

            const reimbursed = advance.reimbursements.reduce(
                (sum, r) => sum + r.amount,
                0
            );
            totalReimbursed += reimbursed;

            const remaining = calculateAdvanceRemaining(advance as any);
            totalOutstanding += remaining;
        });

        return NextResponse.json(
            {
                totalAdvances,
                totalReimbursed,
                totalOutstanding,
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
