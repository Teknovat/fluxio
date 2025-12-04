import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { z } from 'zod';

const updateCategorySchema = z.object({
    label: z.string().min(1).max(100).optional(),
    color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color code').optional(),
    active: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
});

/**
 * PATCH /api/categories/[id]
 * Update a category (Admin only)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;
        const categoryId = params.id;

        // Verify category exists and belongs to tenant
        const category = await prisma.customCategory.findFirst({
            where: {
                id: categoryId,
                tenantId,
            },
        });

        if (!category) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Category not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        const body = await request.json();
        const validatedData = updateCategorySchema.parse(body);

        const updatedCategory = await prisma.customCategory.update({
            where: { id: categoryId },
            data: validatedData,
        });

        return NextResponse.json(updatedCategory, { status: 200 });
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

/**
 * DELETE /api/categories/[id]
 * Delete a category (Admin only)
 * Note: Cannot delete default categories or categories in use
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;
        const categoryId = params.id;

        // Verify category exists and belongs to tenant
        const category = await prisma.customCategory.findFirst({
            where: {
                id: categoryId,
                tenantId,
            },
        });

        if (!category) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Category not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Prevent deletion of default categories
        if (category.isDefault) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Cannot delete default categories',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Check if category is in use
        const mouvementsUsingCategory = await prisma.mouvement.count({
            where: {
                tenantId,
                category: category.code,
            },
        });

        if (mouvementsUsingCategory > 0) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: `Cannot delete category. It is used by ${mouvementsUsingCategory} movement(s)`,
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        await prisma.customCategory.delete({
            where: { id: categoryId },
        });

        return NextResponse.json(
            { message: 'Category deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        return handleAPIError(error);
    }
}
