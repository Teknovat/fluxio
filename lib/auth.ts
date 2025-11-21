import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = '24h';

export interface JWTPayload {
    userId: string;
    email: string;
    role: string; // 'ADMIN' | 'USER'
}

/**
 * Hash a password using bcrypt with 10 salt rounds
 * @param password - Plain text password to hash
 * @returns Hashed password
 */
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param password - Plain text password
 * @param hash - Hashed password to compare against
 * @returns True if passwords match, false otherwise
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

/**
 * Generate a JWT token with user information
 * @param payload - User data to encode in the token
 * @returns JWT token string
 */
export function generateToken(payload: JWTPayload): string {
    return jwt.sign(payload, JWT_SECRET, {
        expiresIn: JWT_EXPIRES_IN,
    });
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string to verify
 * @returns Decoded JWT payload or null if invalid
 */
export function verifyToken(token: string): JWTPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded;
    } catch (error) {
        return null;
    }
}

/**
 * Extract and verify JWT token from request cookies
 * Throws 401 error if token is missing or invalid
 * @param request - Next.js request object
 * @returns Decoded JWT payload
 */
export async function requireAuth(request: Request): Promise<JWTPayload> {
    // Extract token from cookies
    const cookieHeader = request.headers.get('cookie');

    if (!cookieHeader) {
        throw new Error('Unauthorized: No authentication token provided');
    }

    // Parse cookies to find auth-token
    const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        acc[key] = value;
        return acc;
    }, {} as Record<string, string>);

    const token = cookies['auth-token'];

    if (!token) {
        throw new Error('Unauthorized: No authentication token provided');
    }

    // Verify token
    const payload = verifyToken(token);

    if (!payload) {
        throw new Error('Unauthorized: Invalid or expired token');
    }

    return payload;
}

/**
 * Extract and verify JWT token from request cookies and check for ADMIN role
 * Throws 401 error if token is missing or invalid
 * Throws 403 error if user is not an admin
 * @param request - Next.js request object
 * @returns Decoded JWT payload
 */
export async function requireAdmin(request: Request): Promise<JWTPayload> {
    // First verify authentication
    const payload = await requireAuth(request);

    // Check if user has ADMIN role
    if (payload.role !== 'ADMIN') {
        throw new Error('Forbidden: Insufficient permissions');
    }

    return payload;
}
