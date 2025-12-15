import { prisma } from "./prisma";

/**
 * Validation error types for documents
 */
export const DocumentValidationErrors = {
    REFERENCE_EXISTS: "DOCUMENT_REFERENCE_EXISTS",
    INVALID_AMOUNT: "DOCUMENT_INVALID_AMOUNT",
    INVALID_DATES: "DOCUMENT_INVALID_DATES",
    PAYMENT_EXCEEDS_REMAINING: "PAYMENT_EXCEEDS_REMAINING",
    HAS_PAYMENTS: "DOCUMENT_HAS_PAYMENTS",
    AMOUNT_TOO_LOW: "DOCUMENT_AMOUNT_TOO_LOW",
} as const;

/**
 * Validates that a document reference is unique within a tenant
 * 
 * @param reference - The document reference to validate
 * @param tenantId - The tenant ID
 * @param excludeId - Optional document ID to exclude from the check (for updates)
 * @returns Object with isValid boolean and optional error message
 */
export async function validateDocumentReference(
    reference: string,
    tenantId: string,
    excludeId?: string
): Promise<{ isValid: boolean; error?: string }> {
    if (!reference || reference.trim().length === 0) {
        return {
            isValid: false,
            error: "Document reference cannot be empty",
        };
    }

    const existingDocument = await prisma.document.findFirst({
        where: {
            tenantId,
            reference: reference.trim(),
            ...(excludeId && { id: { not: excludeId } }),
        },
    });

    if (existingDocument) {
        return {
            isValid: false,
            error: "A document with this reference already exists",
        };
    }

    return { isValid: true };
}

/**
 * Validates that a document amount is positive
 * 
 * @param amount - The amount to validate
 * @returns Object with isValid boolean and optional error message
 */
export function validateDocumentAmount(
    amount: number
): { isValid: boolean; error?: string } {
    if (typeof amount !== "number" || isNaN(amount)) {
        return {
            isValid: false,
            error: "Amount must be a valid number",
        };
    }

    if (amount <= 0) {
        return {
            isValid: false,
            error: "Amount must be greater than zero",
        };
    }

    return { isValid: true };
}

/**
 * Validates that document dates are logical (due date after issue date)
 * 
 * @param issueDate - The issue date
 * @param dueDate - Optional due date
 * @returns Object with isValid boolean and optional error message
 */
export function validateDocumentDates(
    issueDate: Date | string,
    dueDate?: Date | string | null
): { isValid: boolean; error?: string } {
    const issue = typeof issueDate === "string" ? new Date(issueDate) : issueDate;

    if (isNaN(issue.getTime())) {
        return {
            isValid: false,
            error: "Issue date must be a valid date",
        };
    }

    if (dueDate) {
        const due = typeof dueDate === "string" ? new Date(dueDate) : dueDate;

        if (isNaN(due.getTime())) {
            return {
                isValid: false,
                error: "Due date must be a valid date",
            };
        }

        if (due <= issue) {
            return {
                isValid: false,
                error: "Due date must be after issue date",
            };
        }
    }

    return { isValid: true };
}

/**
 * Validates that a payment amount does not exceed the document's remaining amount
 * 
 * @param amount - The payment amount to validate
 * @param remainingAmount - The document's remaining amount
 * @returns Object with isValid boolean and optional error message
 */
export function validatePaymentAmount(
    amount: number,
    remainingAmount: number
): { isValid: boolean; error?: string } {
    if (typeof amount !== "number" || isNaN(amount)) {
        return {
            isValid: false,
            error: "Payment amount must be a valid number",
        };
    }

    if (amount <= 0) {
        return {
            isValid: false,
            error: "Payment amount must be greater than zero",
        };
    }

    if (amount > remainingAmount) {
        return {
            isValid: false,
            error: `Payment amount (${amount}) exceeds remaining amount (${remainingAmount})`,
        };
    }

    return { isValid: true };
}

/**
 * Checks if a document can be deleted (no linked justifications)
 * 
 * @param document - The document to check (must include justifications)
 * @returns Object with canDelete boolean and optional error message
 */
export function canDeleteDocument(document: {
    id: string;
    justifications?: Array<{ id: string }>;
    paidAmount?: number;
}): { canDelete: boolean; error?: string } {
    // Check if document has justifications array
    if (document.justifications && document.justifications.length > 0) {
        return {
            canDelete: false,
            error: "Cannot delete document with linked justifications",
        };
    }

    // Alternative check using paidAmount if justifications not loaded
    if (document.paidAmount && document.paidAmount > 0) {
        return {
            canDelete: false,
            error: "Cannot delete document with payments",
        };
    }

    return { canDelete: true };
}

/**
 * Checks if a document's total amount can be modified
 * 
 * @param newAmount - The new total amount
 * @param paidAmount - The current paid amount
 * @returns Object with canModify boolean and optional error message
 */
export function canModifyTotalAmount(
    newAmount: number,
    paidAmount: number
): { canModify: boolean; error?: string } {
    if (typeof newAmount !== "number" || isNaN(newAmount)) {
        return {
            canModify: false,
            error: "New amount must be a valid number",
        };
    }

    if (newAmount <= 0) {
        return {
            canModify: false,
            error: "New amount must be greater than zero",
        };
    }

    if (newAmount < paidAmount) {
        return {
            canModify: false,
            error: `Cannot set total amount (${newAmount}) below paid amount (${paidAmount})`,
        };
    }

    return { canModify: true };
}
