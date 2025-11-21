import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { updateIntervenantSchema } from '@/lib/validations';
import { ZodError } from 'zod';

/**
 * PATCH /api/intervenants/[id]
 * Update an existing intervenant (Admin only)
 * Validates input and updates intervenant in database
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin authentication
        await requireAdmin(request);

        const { id } = params;

        // Check if intervenant exists
        const existingIntervenant = await prisma.intervenant.findUnique({
            where: { id },
        });

        if (!existingIntervenant) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Intervenant not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = updateIntervenantSchema.parse(body);

        // Update intervenant in database
        const updatedIntervenant = await prisma.intervenant.update({
            where: { id },
            data: validatedData,
        });

        return NextResponse.json(updatedIntervenant, { status: 200 });

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
