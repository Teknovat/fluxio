import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { DocumentStatus } from '@/types';

/**
 * GET /api/documents/stats
 * Get dashboard statistics for documents
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const now = new Date();
        const sevenDaysFromNow = new Date();
        sevenDaysFromNow.setDate(now.getDate() + 7);

        // Calculate unpaid documents (status = UNPAID)
        const unpaidDocuments = await prisma.document.findMany({
            where: {
                tenantId,
                status: DocumentStatus.UNPAID,
            },
            select: {
                remainingAmount: true,
            },
        });

        const unpaidCount = unpaidDocuments.length;
        const unpaidAmount = unpaidDocuments.reduce((sum: number, doc: any) => sum + doc.remainingAmount, 0);

        // Calculate overdue documents (past due date and not fully paid)
        const overdueDocuments = await prisma.document.findMany({
            where: {
                tenantId,
                status: {
                    in: [DocumentStatus.UNPAID, DocumentStatus.PARTIALLY_PAID],
                },
                dueDate: {
                    lt: now,
                },
            },
            select: {
                remainingAmount: true,
            },
        });

        const overdueCount = overdueDocuments.length;
        const overdueAmount = overdueDocuments.reduce((sum: number, doc: any) => sum + doc.remainingAmount, 0);

        // Calculate documents due within 7 days (not fully paid)
        const dueWithin7DaysDocuments = await prisma.document.findMany({
            where: {
                tenantId,
                status: {
                    in: [DocumentStatus.UNPAID, DocumentStatus.PARTIALLY_PAID],
                },
                dueDate: {
                    gte: now,
                    lte: sevenDaysFromNow,
                },
            },
            select: {
                remainingAmount: true,
            },
        });

        const dueWithin7DaysCount = dueWithin7DaysDocuments.length;
        const dueWithin7DaysAmount = dueWithin7DaysDocuments.reduce((sum: number, doc: any) => sum + doc.remainingAmount, 0);

        // Calculate partially paid documents
        const partiallyPaidDocuments = await prisma.document.findMany({
            where: {
                tenantId,
                status: DocumentStatus.PARTIALLY_PAID,
            },
            select: {
                remainingAmount: true,
            },
        });

        const partiallyPaidCount = partiallyPaidDocuments.length;
        const partiallyPaidAmount = partiallyPaidDocuments.reduce((sum: number, doc: any) => sum + doc.remainingAmount, 0);

        // Return statistics
        return NextResponse.json(
            {
                unpaid: {
                    count: unpaidCount,
                    amount: unpaidAmount,
                },
                overdue: {
                    count: overdueCount,
                    amount: overdueAmount,
                },
                dueWithin7Days: {
                    count: dueWithin7DaysCount,
                    amount: dueWithin7DaysAmount,
                },
                partiallyPaid: {
                    count: partiallyPaidCount,
                    amount: partiallyPaidAmount,
                },
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
