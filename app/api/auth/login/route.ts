import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { comparePassword, generateToken } from '@/lib/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const { email, password, tenantSlug } = body;

        // Validate required fields
        if (!email || !password || !tenantSlug) {
            return NextResponse.json(
                { error: 'Validation error', message: 'Email, password, and tenant are required' },
                { status: 400 }
            );
        }

        // 1. Find tenant by slug
        const tenant = await prisma.tenant.findUnique({
            where: { slug: tenantSlug },
        });

        if (!tenant) {
            return NextResponse.json(
                { error: 'Invalid credentials', message: 'Tenant not found' },
                { status: 401 }
            );
        }

        if (!tenant.active) {
            return NextResponse.json(
                { error: 'Tenant inactive', message: 'This organization has been deactivated' },
                { status: 401 }
            );
        }

        // 2. Query user by email and tenantId
        const user = await prisma.user.findUnique({
            where: {
                tenantId_email: {
                    tenantId: tenant.id,
                    email: email,
                },
            },
        });

        // Check if user exists
        if (!user) {
            return NextResponse.json(
                { error: 'Invalid credentials', message: 'Email or password is incorrect' },
                { status: 401 }
            );
        }

        // Check if user is active
        if (!user.active) {
            return NextResponse.json(
                { error: 'Account inactive', message: 'Your account has been deactivated. Please contact an administrator.' },
                { status: 401 }
            );
        }

        // Compare password with bcrypt
        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials', message: 'Email or password is incorrect' },
                { status: 401 }
            );
        }

        // Generate JWT token on success with tenant info
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            tenantId: tenant.id,
            tenantSlug: tenant.slug,
        });

        // Return user data (without password) and token
        const { password: _, ...userWithoutPassword } = user;

        // Create response with user and tenant data
        const response = NextResponse.json(
            {
                user: {
                    ...userWithoutPassword,
                    tenantName: tenant.name,
                    tenantSlug: tenant.slug,
                },
                token,
            },
            { status: 200 }
        );

        // Set httpOnly cookie with token
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24, // 24 hours
            path: '/',
        });

        return response;

    } catch (error) {
        // Handle validation errors
        if (error instanceof ZodError) {
            return NextResponse.json(
                {
                    error: 'Validation error',
                    message: 'Invalid input data',
                    details: error.errors
                },
                { status: 400 }
            );
        }

        // Handle unexpected errors
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
