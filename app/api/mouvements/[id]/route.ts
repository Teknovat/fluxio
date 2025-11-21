import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { createMouvementSchema } from '@/lib/validations';
import { ZodError } from 'zod';

/**
 * PATCH /api/mouvements/[id]
 * Update an existing mouvement (Admin only)
 * Validates input, verifies intervenant exists (can be inactive)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin authentication
        await requireAdmin(request);

        const { id } = params;

        // Check if mouvement exists
        const existingMouvement = await prisma.mouvement.findUnique({
            where: { id },
        });

        if (!existingMouvement) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Mouvement not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createMouvementSchema.parse(body);

        // Verify intervenant exists (can be inactive for edits)
        const intervenant = await prisma.intervenant.findUnique({
            where: {
                id: validatedData.intervenantId,
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

        // Update mouvement in database
        const updatedMouvement = await prisma.mouvement.update({
            where: { id },
            data: {
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

        return NextResponse.json(updatedMouvement, { status: 200 });

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

/**
 * DELETE /api/mouvements/[id]
 * Delete a mouvement (Admin only)
 * Permanently removes the mouvement from database
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin authentication
        await requireAdmin(request);

        const { id } = params;

        // Check if mouvement exists
        const existingMouvement = await prisma.mouvement.findUnique({
            where: { id },
        });

        if (!existingMouvement) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Mouvement not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Delete mouvement from database
        await prisma.mouvement.delete({
            where: { id },
        });

        return NextResponse.json(
            {
                success: true,
                message: 'Mouvement deleted successfully',
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
