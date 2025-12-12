import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { handleAPIError } from "@/lib/api-errors";

/**
 * GET /api/tenant
 * Get current tenant information and user role
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;
        const userId = payload.userId;

        // Get tenant
        const tenant = await prisma.tenant.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        if (!tenant) {
            return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
        }

        // Get user role
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { role: true },
        });

        return NextResponse.json(
            {
                tenant,
                userRole: user?.role || "USER",
            },
            { status: 200 }
        );
    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * PUT /api/tenant
 * Update tenant name (Admin only)
 */
export async function PUT(request: NextRequest) {
    try {
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        const body = await request.json();
        const { name } = body;

        if (!name || typeof name !== "string" || name.trim().length === 0) {
            return NextResponse.json(
                { error: "Le nom du tenant est requis" },
                { status: 400 }
            );
        }

        // Update tenant
        const updatedTenant = await prisma.tenant.update({
            where: { id: tenantId },
            data: { name: name.trim() },
            select: {
                id: true,
                name: true,
                slug: true,
            },
        });

        return NextResponse.json(updatedTenant, { status: 200 });
    } catch (error) {
        return handleAPIError(error);
    }
}
