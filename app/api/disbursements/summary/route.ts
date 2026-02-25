import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';

/**
 * GET /api/disbursements/summary
 * Calculate summary statistics for disbursements
 * Returns total disbursed, total justified, total outstanding, and breakdown by category
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Parse query parameters for filtering
        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const statusArray = searchParams.getAll('status[]');
        const intervenantId = searchParams.get('intervenantId');
        const category = searchParams.get('category');
        const dateFrom = searchParams.get('dateFrom');
        const dateTo = searchParams.get('dateTo');

        // Build where clause with filters
        const where: any = {
            tenantId, // CRITICAL: Filter by tenant
        };

        // Status filter - support both single status and multiple statuses
        const validStatuses = ['OPEN', 'PARTIALLY_JUSTIFIED', 'JUSTIFIED'];

        if (statusArray.length > 0) {
            // Multiple status filtering using status[]
            const filteredStatuses = statusArray.filter(s => validStatuses.includes(s));
            if (filteredStatuses.length > 0) {
                where.status = { in: filteredStatuses };
            }
        } else if (status && validStatuses.includes(status)) {
            // Single status filtering (backward compatibility)
            where.status = status;
        }

        if (intervenantId) {
            where.intervenantId = intervenantId;
        }

        if (category) {
            where.category = category;
        }

        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) {
                where.createdAt.gte = new Date(dateFrom);
            }
            if (dateTo) {
                where.createdAt.lte = new Date(dateTo);
            }
        }

        // Fetch disbursements with filters applied
        const disbursements = await prisma.disbursement.findMany({
            where,
            include: {
                justifications: {
                    select: {
                        amount: true,
                    },
                },
                returns: {
                    select: {
                        amount: true,
                    },
                },
            },
        });

        // Calculate totals
        let totalDisbursed = 0;
        let totalJustified = 0;
        let totalOutstanding = 0;

        // Group by category
        const byCategory: Record<string, {
            totalDisbursed: number;
            totalJustified: number;
            totalOutstanding: number;
            count: number;
        }> = {};

        disbursements.forEach((disbursement: any) => {
            const category = disbursement.category || 'OTHER';

            // Calculate justified amount (justifications + returns)
            const justifiedAmount =
                disbursement.justifications.reduce((sum: number, j: any) => sum + j.amount, 0) +
                disbursement.returns.reduce((sum: number, r: any) => sum + r.amount, 0);

            const outstanding = disbursement.remainingAmount;

            // Add to totals
            totalDisbursed += disbursement.initialAmount;
            totalJustified += justifiedAmount;
            totalOutstanding += outstanding;

            // Add to category breakdown
            if (!byCategory[category]) {
                byCategory[category] = {
                    totalDisbursed: 0,
                    totalJustified: 0,
                    totalOutstanding: 0,
                    count: 0,
                };
            }

            byCategory[category].totalDisbursed += disbursement.initialAmount;
            byCategory[category].totalJustified += justifiedAmount;
            byCategory[category].totalOutstanding += outstanding;
            byCategory[category].count += 1;
        });

        return NextResponse.json(
            {
                totalDisbursed,
                totalJustified,
                totalOutstanding,
                byCategory,
                totalCount: disbursements.length,
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
