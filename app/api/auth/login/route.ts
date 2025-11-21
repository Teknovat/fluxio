import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { loginSchema } from '@/lib/validations';
import { comparePassword, generateToken } from '@/lib/auth';
import { ZodError } from 'zod';

export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validatedData = loginSchema.parse(body);

        // Query user by email from database
        const user = await prisma.user.findUnique({
            where: {
                email: validatedData.email,
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
        const isPasswordValid = await comparePassword(validatedData.password, user.password);

        if (!isPasswordValid) {
            return NextResponse.json(
                { error: 'Invalid credentials', message: 'Email or password is incorrect' },
                { status: 401 }
            );
        }

        // Generate JWT token on success
        const token = generateToken({
            userId: user.id,
            email: user.email,
            role: user.role,
        });

        // Return user data (without password) and token
        const { password: _, ...userWithoutPassword } = user;

        // Create response with user data
        const response = NextResponse.json(
            {
                user: userWithoutPassword,
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
