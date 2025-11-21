import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        // Create response with success message
        const response = NextResponse.json(
            { success: true, message: 'Logged out successfully' },
            { status: 200 }
        );

        // Clear auth-token cookie
        response.cookies.set('auth-token', '', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 0, // Expire immediately
            path: '/',
        });

        return response;

    } catch (error) {
        // Handle unexpected errors
        console.error('Logout error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: 'An unexpected error occurred' },
            { status: 500 }
        );
    }
}
