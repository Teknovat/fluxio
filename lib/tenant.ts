import { NextRequest } from 'next/server';
import { prisma } from './prisma';
import { verifyToken, JWTPayload } from './auth';

/**
 * Get tenant ID from request
 * Supports multiple strategies: subdomain, path-based, JWT token
 */
export async function getTenantFromRequest(request: NextRequest): Promise<string> {
    // Strategy 1: From JWT token (most reliable for authenticated requests)
    const token = request.cookies.get('auth-token');
    if (token) {
        try {
            const payload = await verifyToken(token.value);
            if (payload && payload.tenantId) {
                return payload.tenantId;
            }
        } catch (error) {
            // Token invalid or expired, try other strategies
        }
    }

    // Strategy 2: Subdomain-based (e.g., company-abc.fluxio.com)
    const host = request.headers.get('host');
    if (host) {
        const subdomain = host.split('.')[0];

        // Skip www and main domain
        if (subdomain && subdomain !== 'www' && subdomain !== 'localhost' && !subdomain.includes(':')) {
            const tenant = await prisma.tenant.findUnique({
                where: { subdomain },
                select: { id: true, active: true },
            });

            if (tenant && tenant.active) {
                return tenant.id;
            }
        }
    }

    // Strategy 3: Path-based (e.g., fluxio.com/company-abc)
    const url = new URL(request.url);
    const pathSegments = url.pathname.split('/').filter(Boolean);

    // Check if first segment is a tenant slug
    if (pathSegments.length > 0 && !pathSegments[0].startsWith('api')) {
        const slug = pathSegments[0];

        const tenant = await prisma.tenant.findUnique({
            where: { slug },
            select: { id: true, active: true },
        });

        if (tenant && tenant.active) {
            return tenant.id;
        }
    }

    throw new Error('Tenant not found');
}

/**
 * Get tenant ID from JWT payload
 */
export function getTenantIdFromPayload(payload: JWTPayload): string {
    if (!payload.tenantId) {
        throw new Error('Tenant ID not found in token');
    }
    return payload.tenantId;
}

/**
 * Wrapper for API handlers that require tenant context
 */
export async function withTenant<T>(
    request: NextRequest,
    handler: (tenantId: string) => Promise<T>
): Promise<T> {
    const tenantId = await getTenantFromRequest(request);
    return handler(tenantId);
}

/**
 * Generate a URL-friendly slug from company name
 */
export function generateSlug(name: string): string {
    return name
        .toLowerCase()
        .normalize('NFD') // Normalize accents
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with dash
        .replace(/^-|-$/g, '') // Remove leading/trailing dashes
        .substring(0, 50); // Limit length
}

/**
 * Check if slug is available
 */
export async function isSlugAvailable(slug: string): Promise<boolean> {
    const existing = await prisma.tenant.findUnique({
        where: { slug },
    });
    return !existing;
}

/**
 * Generate unique slug by appending number if needed
 */
export async function generateUniqueSlug(name: string): Promise<string> {
    let slug = generateSlug(name);
    let counter = 1;

    while (!(await isSlugAvailable(slug))) {
        slug = `${generateSlug(name)}-${counter}`;
        counter++;
    }

    return slug;
}
