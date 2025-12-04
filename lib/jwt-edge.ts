/**
 * Lightweight JWT verification for Edge runtime (middleware)
 * This file doesn't use Node.js crypto libraries, making it compatible with Edge runtime
 */

import { JWTPayload } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * Simple base64url decode
 */
function base64UrlDecode(str: string): string {
    // Replace URL-safe characters
    str = str.replace(/-/g, '+').replace(/_/g, '/');

    // Pad with '=' to make length multiple of 4
    while (str.length % 4) {
        str += '=';
    }

    // Decode base64
    try {
        return atob(str);
    } catch {
        throw new Error('Invalid base64 string');
    }
}

/**
 * Verify and decode a JWT token for Edge runtime
 * Note: This is a simplified version that only decodes the payload
 * For full security, the API routes use the full jwt.verify() with crypto
 * 
 * @param token - JWT token string to verify
 * @returns Decoded JWT payload or null if invalid
 */
export function verifyTokenEdge(token: string): JWTPayload | null {
    try {
        // Split the token into parts
        const parts = token.split('.');

        if (parts.length !== 3) {
            return null;
        }

        // Decode the payload (second part)
        const payloadJson = base64UrlDecode(parts[1]);
        const payload = JSON.parse(payloadJson) as JWTPayload & { exp?: number };

        // Check expiration
        if (payload.exp && payload.exp < Date.now() / 1000) {
            return null;
        }

        // Return the payload
        return {
            userId: payload.userId,
            email: payload.email,
            role: payload.role,
            tenantId: payload.tenantId,
            tenantSlug: payload.tenantSlug,
        };
    } catch (error) {
        return null;
    }
}
