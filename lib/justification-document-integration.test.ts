/**
 * Integration tests for justification-document linking
 * Tests Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 4.4, 4.5
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { calculateDocumentStatus, calculateRemainingAmount, sumJustificationAmounts } from './document-calculations';
import { validatePaymentAmount } from './document-validations';

describe('Justification-Document Integration', () => {
    describe('Payment validation', () => {
        it('should validate payment amount against document remaining amount', () => {
            // Requirement 3.2: Validate payment amount does not exceed remaining
            const remainingAmount = 1000;
            const validAmount = 500;
            const invalidAmount = 1500;

            const validResult = validatePaymentAmount(validAmount, remainingAmount);
            expect(validResult.isValid).toBe(true);

            const invalidResult = validatePaymentAmount(invalidAmount, remainingAmount);
            expect(invalidResult.isValid).toBe(false);
            expect(invalidResult.error).toContain('exceeds remaining amount');
        });

        it('should allow payment equal to remaining amount', () => {
            // Requirement 3.2: Allow exact remaining amount
            const remainingAmount = 1000;
            const exactAmount = 1000;

            const result = validatePaymentAmount(exactAmount, remainingAmount);
            expect(result.isValid).toBe(true);
        });

        it('should reject zero or negative payment amounts', () => {
            const remainingAmount = 1000;

            const zeroResult = validatePaymentAmount(0, remainingAmount);
            expect(zeroResult.isValid).toBe(false);

            const negativeResult = validatePaymentAmount(-100, remainingAmount);
            expect(negativeResult.isValid).toBe(false);
        });
    });

    describe('Document amount calculations', () => {
        it('should calculate remaining amount correctly', () => {
            // Requirement 3.5: Recalculate remaining amount
            const totalAmount = 5000;
            const paidAmount = 2000;

            const remaining = calculateRemainingAmount(totalAmount, paidAmount);
            expect(remaining).toBe(3000);
        });

        it('should sum justification amounts correctly', () => {
            // Requirement 3.4: Update document paid amount
            const justifications = [
                { amount: 500 },
                { amount: 750 },
                { amount: 250 },
            ];

            const total = sumJustificationAmounts(justifications);
            expect(total).toBe(1500);
        });

        it('should handle empty justifications array', () => {
            const justifications: { amount: number }[] = [];
            const total = sumJustificationAmounts(justifications);
            expect(total).toBe(0);
        });
    });

    describe('Document status calculation', () => {
        it('should set status to UNPAID when paid amount is zero', () => {
            // Requirement 4.1: Status UNPAID when paid = 0
            const status = calculateDocumentStatus(5000, 0);
            expect(status).toBe('UNPAID');
        });

        it('should set status to PARTIALLY_PAID when paid is between zero and total', () => {
            // Requirement 4.2: Status PARTIALLY_PAID when 0 < paid < total
            const status = calculateDocumentStatus(5000, 2500);
            expect(status).toBe('PARTIALLY_PAID');
        });

        it('should set status to PAID when paid equals total', () => {
            // Requirement 4.3: Status PAID when paid = total
            const status = calculateDocumentStatus(5000, 5000);
            expect(status).toBe('PAID');
        });

        it('should set status to PAID when paid exceeds total', () => {
            // Edge case: overpayment (shouldn't happen with validation)
            const status = calculateDocumentStatus(5000, 5500);
            expect(status).toBe('PAID');
        });
    });

    describe('Payment recalculation scenarios', () => {
        it('should recalculate correctly after adding payment', () => {
            // Requirement 3.4, 3.5: Add payment and recalculate
            const totalAmount = 10000;
            let paidAmount = 3000;
            const newPayment = 2000;

            // Add payment
            paidAmount += newPayment;
            const remaining = calculateRemainingAmount(totalAmount, paidAmount);
            const status = calculateDocumentStatus(totalAmount, paidAmount);

            expect(paidAmount).toBe(5000);
            expect(remaining).toBe(5000);
            expect(status).toBe('PARTIALLY_PAID');
        });

        it('should recalculate correctly after deleting payment', () => {
            // Requirement 4.4: Delete payment and recalculate
            const totalAmount = 10000;
            const justifications = [
                { amount: 3000 },
                { amount: 2000 },
                { amount: 1500 },
            ];

            // Remove one justification
            const remainingJustifications = justifications.slice(0, 2);
            const newPaidAmount = sumJustificationAmounts(remainingJustifications);
            const remaining = calculateRemainingAmount(totalAmount, newPaidAmount);
            const status = calculateDocumentStatus(totalAmount, newPaidAmount);

            expect(newPaidAmount).toBe(5000);
            expect(remaining).toBe(5000);
            expect(status).toBe('PARTIALLY_PAID');
        });

        it('should recalculate correctly after modifying payment amount', () => {
            // Requirement 4.5: Modify payment and recalculate
            const totalAmount = 10000;
            const justifications = [
                { amount: 3000 },
                { amount: 2000 },
            ];

            // Modify second justification from 2000 to 3500
            justifications[1].amount = 3500;
            const newPaidAmount = sumJustificationAmounts(justifications);
            const remaining = calculateRemainingAmount(totalAmount, newPaidAmount);
            const status = calculateDocumentStatus(totalAmount, newPaidAmount);

            expect(newPaidAmount).toBe(6500);
            expect(remaining).toBe(3500);
            expect(status).toBe('PARTIALLY_PAID');
        });

        it('should transition to PAID status when final payment is made', () => {
            // Complete payment scenario
            const totalAmount = 10000;
            const justifications = [
                { amount: 4000 },
                { amount: 3000 },
                { amount: 3000 }, // Final payment
            ];

            const paidAmount = sumJustificationAmounts(justifications);
            const remaining = calculateRemainingAmount(totalAmount, paidAmount);
            const status = calculateDocumentStatus(totalAmount, paidAmount);

            expect(paidAmount).toBe(10000);
            expect(remaining).toBe(0);
            expect(status).toBe('PAID');
        });

        it('should transition back to PARTIALLY_PAID when payment is deleted from PAID document', () => {
            // Requirement 4.4: Status changes when payment deleted
            const totalAmount = 10000;
            const justifications = [
                { amount: 6000 },
                { amount: 4000 },
            ];

            // Initially PAID
            let paidAmount = sumJustificationAmounts(justifications);
            let status = calculateDocumentStatus(totalAmount, paidAmount);
            expect(status).toBe('PAID');

            // Delete one payment
            const remainingJustifications = justifications.slice(0, 1);
            paidAmount = sumJustificationAmounts(remainingJustifications);
            const remaining = calculateRemainingAmount(totalAmount, paidAmount);
            status = calculateDocumentStatus(totalAmount, paidAmount);

            expect(paidAmount).toBe(6000);
            expect(remaining).toBe(4000);
            expect(status).toBe('PARTIALLY_PAID');
        });
    });

    describe('Multiple payments workflow', () => {
        it('should handle multiple partial payments correctly', () => {
            // Requirement 3.4, 3.5: Multiple payments scenario
            const totalAmount = 15000;
            const payments = [
                { amount: 3000 },
                { amount: 2500 },
                { amount: 4000 },
                { amount: 3500 },
            ];

            const paidAmount = sumJustificationAmounts(payments);
            const remaining = calculateRemainingAmount(totalAmount, paidAmount);
            const status = calculateDocumentStatus(totalAmount, paidAmount);

            expect(paidAmount).toBe(13000);
            expect(remaining).toBe(2000);
            expect(status).toBe('PARTIALLY_PAID');
        });
    });
});
