import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { DEFAULT_CATEGORY_COLORS } from '@/lib/category-colors';
import { z } from 'zod';

// Default categories that should be created for new tenants
const DEFAULT_CATEGORIES = [
    { code: 'SALAIRES', label: 'Salaires', color: DEFAULT_CATEGORY_COLORS.SALAIRES, sortOrder: 1 },
    { code: 'ACHATS_STOCK', label: 'Achats de stock', color: DEFAULT_CATEGORY_COLORS.ACHATS_STOCK, sortOrder: 2 },
    { code: 'FRAIS_GENERAUX', label: 'Frais généraux', color: DEFAULT_CATEGORY_COLORS.FRAIS_GENERAUX, sortOrder: 3 },
    { code: 'AVANCES_ASSOCIES', label: 'Avances associés', color: DEFAULT_CATEGORY_COLORS.AVANCES_ASSOCIES, sortOrder: 4 },
    { code: 'VENTES', label: 'Ventes', color: DEFAULT_CATEGORY_COLORS.VENTES, sortOrder: 5 },
    { code: 'CHARGES_FIXES', label: 'Charges fixes', color: DEFAULT_CATEGORY_COLORS.CHARGES_FIXES, sortOrder: 6 },
    { code: 'AUTRES', label: 'Autres', color: DEFAULT_CATEGORY_COLORS.AUTRES, sortOrder: 7 },
];

/**
 * GET /api/categories
 * Fetch all categories for the tenant (All authenticated users)
 */
export async function GET(request: NextRequest) {
    try {
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Check if tenant has any categories
        const existingCategories = await prisma.customCategory.findMany({
            where: { tenantId },
            orderBy: { sortOrder: 'asc' },
        });

        // If no categories exist, create default ones
        if (existingCategories.length === 0) {
            const defaultCategories = await prisma.customCategory.createMany({
                data: DEFAULT_CATEGORIES.map(cat => ({
                    ...cat,
                    tenantId,
                    isDefault: true,
                    active: true,
                })),
            });

            // Fetch the newly created categories
            const categories = await prisma.customCategory.findMany({
                where: { tenantId },
                orderBy: { sortOrder: 'asc' },
            });

            return NextResponse.json(categories, { status: 200 });
        }

        return NextResponse.json(existingCategories, { status: 200 });
    } catch (error) {
        return handleAPIError(error);
    }
}

const createCategorySchema = z.object({
    code: z.string().min(1).max(50).regex(/^[A-Z0-9_]+$/, 'Code must contain only uppercase letters, numbers, and underscores'),
    label: z.string().min(1).max(100),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code').optional(),
    sortOrder: z.number().int().min(0).optional(),
});

/**
 * POST /api/categories
 * Create a new custom category (Admin only)
 */
export async function POST(request: NextRequest) {
    try {
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        const body = await request.json();
        const validatedData = createCategorySchema.parse(body);

        // Check if code already exists for this tenant
        const existing = await prisma.customCategory.findUnique({
            where: {
                tenantId_code: {
                    tenantId,
                    code: validatedData.code,
                },
            },
        });

        if (existing) {
            return NextResponse.json(
                {
                    error: 'Conflict',
                    message: 'A category with this code already exists',
                    statusCode: 409,
                },
                { status: 409 }
            );
        }

        // Get the highest sort order
        const maxSortOrder = await prisma.customCategory.findFirst({
            where: { tenantId },
            orderBy: { sortOrder: 'desc' },
            select: { sortOrder: true },
        });

        const newCategory = await prisma.customCategory.create({
            data: {
                tenantId,
                code: validatedData.code,
                label: validatedData.label,
                color: validatedData.color ?? '#6B7280',
                sortOrder: validatedData.sortOrder ?? (maxSortOrder?.sortOrder ?? 0) + 1,
                active: true,
                isDefault: false,
            },
        });

        return NextResponse.json(newCategory, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
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
