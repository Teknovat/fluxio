import { NextResponse } from 'next/server';

/**
 * Standard API error response format
 */
export interface APIError {
    error: string;
    message: string;
    statusCode: number;
    details?: any;
}

/**
 * Handle errors in API routes and return appropriate response
 * @param error - Error object
 * @returns NextResponse with error details
 */
export function handleAPIError(error: unknown): NextResponse<APIError> {
    if (error instanceof Error) {
        const message = error.message;

        // Handle authentication errors (401)
        if (message.startsWith('Unauthorized:')) {
            return NextResponse.json(
                {
                    error: 'Unauthorized',
                    message: message.replace('Unauthorized: ', ''),
                    statusCode: 401,
                },
                { status: 401 }
            );
        }

        // Handle authorization errors (403)
        if (message.startsWith('Forbidden:')) {
            return NextResponse.json(
                {
                    error: 'Forbidden',
                    message: message.replace('Forbidden: ', ''),
                    statusCode: 403,
                },
                { status: 403 }
            );
        }

        // Handle validation errors (400)
        if (message.includes('validation') || message.includes('invalid')) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: message,
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Generic server error (500)
        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: message,
                statusCode: 500,
            },
            { status: 500 }
        );
    }

    // Unknown error type
    return NextResponse.json(
        {
            error: 'Internal Server Error',
            message: 'An unexpected error occurred',
            statusCode: 500,
        },
        { status: 500 }
    );
}
