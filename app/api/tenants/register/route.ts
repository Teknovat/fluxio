import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword, generateToken } from '@/lib/auth';
import { generateUniqueSlug } from '@/lib/tenant';
import { handleAPIError } from '@/lib/api-errors';
import { z } from 'zod';

const registerSchema = z.object({
    companyName: z.string().min(2, 'Company name must be at least 2 characters'),
    adminName: z.string().min(2, 'Admin name must be at least 2 characters'),
    adminEmail: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * POST /api/tenants/register
 * Register a new tenant with admin user
 */
export async function POST(request: NextRequest) {
    try {
        // Parse and validate request body
        const body = await request.json();
        const validatedData = registerSchema.parse(body);

        const { companyName, adminName, adminEmail, password } = validatedData;

        // Generate unique slug
        const slug = await generateUniqueSlug(companyName);

        // Check if email already exists across all tenants (optional - you may want to allow same email in different tenants)
        // For now, we'll allow same email in different tenants

        // Create tenant and admin user in transaction
        const result = await prisma.$transaction(async (tx) => {
            // 1. Create tenant
            const tenant = await tx.tenant.create({
                data: {
                    name: companyName,
                    slug,
                    active: true,
                },
            });

            // 2. Create admin user
            const hashedPassword = await hashPassword(password);
            const admin = await tx.user.create({
                data: {
                    tenantId: tenant.id,
                    name: adminName,
                    email: adminEmail,
                    password: hashedPassword,
                    role: 'ADMIN',
                    active: true,
                },
            });

            return { tenant, admin };
        });

        // 3. Generate JWT token
        const token = generateToken({
            userId: result.admin.id,
            email: result.admin.email,
            role: result.admin.role,
            tenantId: result.tenant.id,
            tenantSlug: result.tenant.slug,
        });

        // 4. Return response
        return NextResponse.json(
            {
                tenant: {
                    id: result.tenant.id,
                    name: result.tenant.name,
                    slug: result.tenant.slug,
                },
                user: {
                    id: result.admin.id,
                    name: result.admin.name,
                    email: result.admin.email,
                    role: result.admin.role,
                },
                token,
            },
            { status: 201 }
        );
    } catch (error) {
        if (error instanceof z.ZodError) {
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
