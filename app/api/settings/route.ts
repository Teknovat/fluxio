import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';

/**
 * GET /api/settings
 * Fetch settings for the tenant (creates default settings if not found)
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        let settings = await prisma.settings.findUnique({
            where: {
                tenantId,
            },
        });

        // If settings don't exist, create them with defaults
        if (!settings) {
            settings = await prisma.settings.create({
                data: {
                    tenantId,
                    debtThreshold: 10000,
                    minCashBalance: 5000,
                    reconciliationGapThreshold: 500,
                    defaultAdvanceDueDays: 30,
                    disbursementOutstandingThreshold: 10000,
                    disbursementOpenDaysWarning: 30,
                    companyName: 'Fluxio',
                    currency: 'TND',
                    alertsEnabled: true,
                    categoriesEnabled: true,
                    advancesEnabled: true,
                },
            });
        }

        return NextResponse.json(settings, { status: 200 });
    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * PUT /api/settings
 * Update settings for the tenant (Admin only)
 */
export async function PUT(request: NextRequest) {
    try {
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        const body = await request.json();

        // Build update data dynamically to handle optional fields
        const updateData: any = {
            debtThreshold: body.debtThreshold,
            minCashBalance: body.minCashBalance,
            reconciliationGapThreshold: body.reconciliationGapThreshold,
            defaultAdvanceDueDays: body.defaultAdvanceDueDays,
            companyName: body.companyName,
            currency: body.currency,
            alertsEnabled: body.alertsEnabled,
        };

        // Add new fields if they exist in the body
        if (body.disbursementOutstandingThreshold !== undefined) {
            updateData.disbursementOutstandingThreshold = body.disbursementOutstandingThreshold;
        }
        if (body.disbursementOpenDaysWarning !== undefined) {
            updateData.disbursementOpenDaysWarning = body.disbursementOpenDaysWarning;
        }

        // Update settings
        const updatedSettings = await prisma.settings.update({
            where: {
                tenantId,
            },
            data: updateData,
        });

        return NextResponse.json(updatedSettings, { status: 200 });
    } catch (error) {
        return handleAPIError(error);
    }
}
