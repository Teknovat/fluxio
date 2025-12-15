/**
 * Document Calculation Utilities
 * 
 * This module provides calculation functions for the Document Tracking System.
 * These functions handle amount calculations, status determination, and payment aggregation.
 * 
 * Requirements: 1.2, 4.1, 4.2, 4.3
 */

export type DocumentStatus = 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';

export interface JustificationAmount {
    amount: number;
}

/**
 * Calculate the remaining amount for a document
 * 
 * @param totalAmount - The total amount of the document
 * @param paidAmount - The amount already paid
 * @returns The remaining amount (totalAmount - paidAmount)
 * 
 * Requirement 1.2: Initialize remaining amount to total amount minus paid amount
 */
export function calculateRemainingAmount(
    totalAmount: number,
    paidAmount: number
): number {
    return totalAmount - paidAmount;
}

/**
 * Calculate the document status based on payment amounts
 * 
 * @param totalAmount - The total amount of the document
 * @param paidAmount - The amount already paid
 * @returns The document status (UNPAID, PARTIALLY_PAID, or PAID)
 * 
 * Requirements:
 * - 4.1: When paid amount equals zero, status is UNPAID
 * - 4.2: When paid amount is between zero and total, status is PARTIALLY_PAID
 * - 4.3: When paid amount equals total amount, status is PAID
 */
export function calculateDocumentStatus(
    totalAmount: number,
    paidAmount: number
): DocumentStatus {
    if (paidAmount === 0) {
        return 'UNPAID';
    } else if (paidAmount >= totalAmount) {
        return 'PAID';
    } else {
        return 'PARTIALLY_PAID';
    }
}

/**
 * Calculate the payment percentage for a document
 * 
 * @param totalAmount - The total amount of the document
 * @param paidAmount - The amount already paid
 * @returns The payment percentage (0-100)
 * 
 * Requirement 5.3: Display payment progress as a percentage
 */
export function calculatePaymentPercentage(
    totalAmount: number,
    paidAmount: number
): number {
    if (totalAmount === 0) {
        return 0;
    }

    const percentage = (paidAmount / totalAmount) * 100;

    // Clamp between 0 and 100
    return Math.min(Math.max(percentage, 0), 100);
}

/**
 * Sum the amounts from an array of justifications
 * 
 * @param justifications - Array of objects with amount property
 * @returns The sum of all justification amounts
 * 
 * Requirement 3.4: Update document's paid amount by adding justification amounts
 */
export function sumJustificationAmounts(
    justifications: JustificationAmount[]
): number {
    return justifications.reduce((sum, justification) => sum + justification.amount, 0);
}
