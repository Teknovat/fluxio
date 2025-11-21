import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { createUserSchema } from '@/lib/validations';
import { hashPassword } from '@/lib/auth';
import { ZodError } from 'zod';

/**
 * GET /api/users
 * Fetch all users from database (Admin only)
 * Returns list of users without password field
 */
export async function GET(request: NextRequest) {
    try {
        // Verify admin authentication
        await requireAdmin(request);

        // Fetch all users from database
        const users = await prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
                // Explicitly exclude password field
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return NextResponse.json(users, { status: 200 });

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * POST /api/users
 * Create a new user (Admin only)
 * Validates input, checks email uniqueness, hashes password
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication
        await requireAdmin(request);

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createUserSchema.parse(body);

        // Check email uniqueness
        const existingUser = await prisma.user.findUnique({
            where: {
                email: validatedData.email,
            },
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    error: 'Conflict',
                    message: 'A user with this email already exists',
                    statusCode: 409,
                },
                { status: 409 }
            );
        }

        // Hash password with bcrypt
        const hashedPassword = await hashPassword(validatedData.password);

        // Create user in database
        const newUser = await prisma.user.create({
            data: {
                name: validatedData.name,
                email: validatedData.email,
                password: hashedPassword,
                role: validatedData.role,
                active: true, // New users are active by default
            },
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

        return NextResponse.json(newUser, { status: 201 });

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
