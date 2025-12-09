import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth, requireAdmin } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { createIntervenantSchema } from '@/lib/validations';
import { ZodError } from 'zod';

/**
 * GET /api/intervenants
 * Fetch intervenants with optional filters (accessible to all authenticated users)
 * Query params: type, active
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const typeParam = searchParams.get('type');
        const activeParam = searchParams.get('active');

        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '25');
        const skip = (page - 1) * limit;

        // Build filter object - ALWAYS filter by tenantId
        const where: any = {
            tenantId, // CRITICAL: Filter by tenant
        };

        // Filter by type if provided
        if (typeParam) {
            where.type = typeParam;
        }

        // Filter by active status if provided
        if (activeParam !== null) {
            where.active = activeParam === 'true';
        }

        // Get total count for pagination
        const totalCount = await prisma.intervenant.count({ where });

        // Fetch filtered intervenants from database with pagination
        const intervenants = await prisma.intervenant.findMany({
            where,
            orderBy: {
                name: 'asc',
            },
            skip,
            take: limit,
        });

        return NextResponse.json(
            {
                intervenants,
                pagination: {
                    page,
                    limit,
                    totalCount,
                    totalPages: Math.ceil(totalCount / limit),
                },
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * POST /api/intervenants
 * Create a new intervenant (Admin only)
 * Validates input and creates intervenant in database
 */
export async function POST(request: NextRequest) {
    try {
        // Verify admin authentication and get tenant
        const payload = await requireAdmin(request);
        const tenantId = payload.tenantId;

        // Parse and validate request body
        const body = await request.json();
        const validatedData = createIntervenantSchema.parse(body);

        // Create intervenant in database with tenantId
        const newIntervenant = await prisma.intervenant.create({
            data: {
                tenantId, // CRITICAL: Set tenant
                name: validatedData.name,
                type: validatedData.type,
                active: true, // New intervenants are active by default
            },
        });

        return NextResponse.json(newIntervenant, { status: 201 });

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
