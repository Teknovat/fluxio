import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';

/**
 * Example API route demonstrating requireAuth middleware usage
 * This endpoint is accessible to any authenticated user
 */
export async function GET(request: NextRequest) {
    try {
        // Extract and verify JWT token from cookies
        const user = await requireAuth(request);

        // If we reach here, the user is authenticated
        return NextResponse.json({
            message: 'Authentication successful',
            user: {
                userId: user.userId,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        // Handle authentication errors (401) and other errors
        return handleAPIError(error);
    }
}
