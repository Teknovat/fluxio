import { Disbursement, DisbursementStatus } from "@/types";

/**
 * Calculate the remaining amount for a disbursement
 * Remaining = Initial - (Total Justified + Total Returned)
 */
export function calculateDisbursementRemaining(disbursement: Disbursement): number {
    const totalJustified =
        disbursement.justifications?.reduce((sum, j) => sum + j.amount, 0) || 0;
    const totalReturned =
        disbursement.returns?.reduce((sum, r) => sum + r.amount, 0) || 0;
    return disbursement.initialAmount - totalJustified - totalReturned;
}

/**
 * Determine the status of a disbursement based on remaining amount
 * - JUSTIFIED: remaining = 0
 * - PARTIALLY_JUSTIFIED: 0 < remaining < initial
 * - OPEN: remaining = initial
 */
export function determineDisbursementStatus(
    disbursement: Disbursement
): DisbursementStatus {
    const remaining = calculateDisbursementRemaining(disbursement);

    if (remaining === 0) {
        return DisbursementStatus.JUSTIFIED;
    }

    if (remaining < disbursement.initialAmount) {
        return DisbursementStatus.PARTIALLY_JUSTIFIED;
    }

    return DisbursementStatus.OPEN;
}

/**
 * Check if a disbursement is overdue
 * A disbursement is overdue if:
 * - It has a due date
 * - The due date is in the past
 * - It is not fully justified (status !== JUSTIFIED)
 */
export function isDisbursementOverdue(disbursement: Disbursement): boolean {
    if (!disbursement.dueDate) {
        return false;
    }

    if (disbursement.status === DisbursementStatus.JUSTIFIED) {
        return false;
    }

    return new Date(disbursement.dueDate) < new Date();
}

/**
 * Calculate the number of days since the disbursement was created
 */
export function getDaysOutstanding(disbursement: Disbursement): number {
    const now = new Date();
    const created = new Date(disbursement.createdAt);
    const diffTime = Math.abs(now.getTime() - created.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
