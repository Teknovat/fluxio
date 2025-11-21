import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';

/**
 * Example API route demonstrating requireAdmin middleware usage
 * This endpoint is only accessible to users with ADMIN role
 */
export async function GET(request: NextRequest) {
    try {
        // Extract and verify JWT token from cookies, and check for ADMIN role
        const user = await requireAdmin(request);

        // If we reach here, the user is authenticated and has ADMIN role
        return NextResponse.json({
            message: 'Admin authentication successful',
            user: {
                userId: user.userId,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        // Handle authentication errors (401), authorization errors (403), and other errors
        return handleAPIError(error);
    }
}
