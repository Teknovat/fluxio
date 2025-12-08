/**
 * Simple in-memory cache for cash balance with 5-minute TTL
 */

interface CacheEntry {
    balance: number;
    lastUpdated: Date;
    expiresAt: number;
}

const balanceCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Get cached balance if available and not expired
 */
export function getCachedBalance(tenantId: string): CacheEntry | null {
    const cached = balanceCache.get(tenantId);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.expiresAt) {
        // Cache expired, remove it
        balanceCache.delete(tenantId);
        return null;
    }

    return cached;
}

/**
 * Set balance in cache with TTL
 */
export function setCachedBalance(tenantId: string, balance: number): void {
    const now = Date.now();
    balanceCache.set(tenantId, {
        balance,
        lastUpdated: new Date(),
        expiresAt: now + CACHE_TTL_MS,
    });
}

/**
 * Clear cache for a specific tenant (used when balance changes)
 */
export function clearBalanceCache(tenantId: string): void {
    balanceCache.delete(tenantId);
}
