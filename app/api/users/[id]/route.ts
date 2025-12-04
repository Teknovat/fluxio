import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { updateUserSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import { ZodError } from 'zod';

/**
 * PATCH /api/users/[id]
 * Update an existing user (Admin only)
 * Validates input, checks if last active admin, hashes password if provided
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify admin authentication and get tenant
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        const userId = params.id;

        // Check if user exists AND belongs to same tenant
        const existingUser = await prisma.user.findFirst({
            where: {
                id: userId,
                tenantId, // CRITICAL: Verify user belongs to tenant
            },
        });

        if (!existingUser) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'User not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Parse and validate request body
        const body = await request.json();
        const validatedData = updateUserSchema.parse(body);

        // If deactivating an admin, check if it's the last active admin
        if (validatedData.active === false && existingUser.role === 'ADMIN' && existingUser.active) {
            // Count active admins IN THIS TENANT
            const activeAdminCount = await prisma.user.count({
                where: {
                    tenantId, // CRITICAL: Count only in this tenant
                    role: 'ADMIN',
                    active: true,
                },
            });

            // If this is the last active admin, prevent deactivation
            if (activeAdminCount === 1) {
                return NextResponse.json(
                    {
                        error: 'Conflict',
                        message: 'Cannot deactivate the last active admin user',
                        statusCode: 409,
                    },
                    { status: 409 }
                );
            }
        }

        // Prepare update data
        const updateData: any = {};

        if (validatedData.name !== undefined) {
            updateData.name = validatedData.name;
        }

        if (validatedData.email !== undefined) {
            // Check email uniqueness if email is being changed IN THIS TENANT
            if (validatedData.email !== existingUser.email) {
                const emailExists = await prisma.user.findUnique({
                    where: {
                        tenantId_email: {
                            tenantId,
                            email: validatedData.email,
                        },
                    },
                });

                if (emailExists) {
                    return NextResponse.json(
                        {
                            error: 'Conflict',
                            message: 'A user with this email already exists',
                            statusCode: 409,
                        },
                        { status: 409 }
                    );
                }
            }
            updateData.email = validatedData.email;
        }

        if (validatedData.role !== undefined) {
            updateData.role = validatedData.role;
        }

        if (validatedData.active !== undefined) {
            updateData.active = validatedData.active;
        }

        // If updating password, hash with bcrypt
        if (validatedData.password !== undefined) {
            updateData.password = await hashPassword(validatedData.password);
        }

        // Update user in database
        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                // Exclude password field
            },
        });

        return NextResponse.json(updatedUser, { status: 200 });

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
