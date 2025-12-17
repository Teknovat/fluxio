import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { DocumentType } from '@/types';
import { validateDocumentReference, validateDocumentAmount, validateDocumentDates, canDeleteDocument, canModifyTotalAmount } from '@/lib/document-validations';
import { calculateRemainingAmount, calculateDocumentStatus } from '@/lib/document-calculations';

/**
 * GET /api/documents/[id]
 * Get single document with payment history
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const documentId = params.id;

        // Fetch document with payment history
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                tenantId, // CRITICAL: Verify tenant ownership
            },
            include: {
                justifications: {
                    include: {
                        disbursement: {
                            include: {
                                intervenant: {
                                    select: {
                                        id: true,
                                        name: true,
                                        type: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        date: 'desc',
                    },
                },
            },
        });

        if (!document) {
            return NextResponse.json(
                {
                    error: 'DOCUMENT_NOT_FOUND',
                    message: 'Document does not exist or access denied',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Format payment history
        const payments = document.justifications.map((justification: any) => ({
            justification: {
                id: justification.id,
                date: justification.date,
                amount: justification.amount,
                category: justification.category,
                reference: justification.reference,
                note: justification.note,
            },
            disbursement: {
                id: justification.disbursement.id,
                initialAmount: justification.disbursement.initialAmount,
                remainingAmount: justification.disbursement.remainingAmount,
                status: justification.disbursement.status,
            },
            intervenant: justification.disbursement.intervenant,
        }));

        // Calculate payment progress percentage
        const paymentPercentage = document.totalAmount > 0
            ? (document.paidAmount / document.totalAmount) * 100
            : 0;

        return NextResponse.json(
            {
                document: {
                    ...document,
                    justifications: undefined, // Remove to avoid duplication
                },
                payments,
                paymentPercentage,
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * PUT /api/documents/[id]
 * Update document with validation
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const documentId = params.id;

        // Fetch existing document
        const existingDocument = await prisma.document.findFirst({
            where: {
                id: documentId,
                tenantId, // CRITICAL: Verify tenant ownership
            },
        });

        if (!existingDocument) {
            return NextResponse.json(
                {
                    error: 'DOCUMENT_NOT_FOUND',
                    message: 'Document does not exist or access denied',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Parse request body
        const body = await request.json();
        const {
            type,
            reference,
            totalAmount,
            issueDate,
            dueDate,
            notes,
            attachments,
        } = body;

        // Build update data object
        const updateData: any = {};

        // Validate and update type if provided
        if (type !== undefined) {
            if (!Object.values(DocumentType).includes(type)) {
                return NextResponse.json(
                    {
                        error: 'Validation Error',
                        message: 'Invalid document type',
                        statusCode: 400,
                    },
                    { status: 400 }
                );
            }
            updateData.type = type;
        }

        // Validate and update reference if provided
        if (reference !== undefined && reference !== existingDocument.reference) {
            const referenceValidation = await validateDocumentReference(reference, tenantId, documentId);
            if (!referenceValidation.isValid) {
                return NextResponse.json(
                    {
                        error: 'DOCUMENT_REFERENCE_EXISTS',
                        message: referenceValidation.error || 'Reference already exists for this tenant',
                        statusCode: 400,
                    },
                    { status: 400 }
                );
            }
            updateData.reference = reference;
        }

        // Validate and update total amount if provided
        if (totalAmount !== undefined && totalAmount !== existingDocument.totalAmount) {
            const amountValidation = validateDocumentAmount(totalAmount);
            if (!amountValidation.isValid) {
                return NextResponse.json(
                    {
                        error: 'DOCUMENT_INVALID_AMOUNT',
                        message: amountValidation.error || 'Total amount must be greater than zero',
                        statusCode: 400,
                    },
                    { status: 400 }
                );
            }

            // Check if total amount can be modified (must not be less than paid amount)
            const canModify = canModifyTotalAmount(totalAmount, existingDocument.paidAmount);
            if (!canModify.canModify) {
                return NextResponse.json(
                    {
                        error: 'DOCUMENT_AMOUNT_TOO_LOW',
                        message: canModify.error || 'Cannot reduce total amount below paid amount',
                        statusCode: 400,
                    },
                    { status: 400 }
                );
            }

            updateData.totalAmount = totalAmount;
            // Recalculate remaining amount and status
            updateData.remainingAmount = calculateRemainingAmount(totalAmount, existingDocument.paidAmount);
            updateData.status = calculateDocumentStatus(totalAmount, existingDocument.paidAmount);
        }

        // Validate and update dates if provided
        const newIssueDate = issueDate || existingDocument.issueDate;
        const newDueDate = dueDate !== undefined ? dueDate : existingDocument.dueDate;

        if (issueDate !== undefined || dueDate !== undefined) {
            const datesValidation = validateDocumentDates(newIssueDate, newDueDate);
            if (!datesValidation.isValid) {
                return NextResponse.json(
                    {
                        error: 'DOCUMENT_INVALID_DATES',
                        message: datesValidation.error || 'Due date must be after issue date',
                        statusCode: 400,
                    },
                    { status: 400 }
                );
            }

            if (issueDate !== undefined) {
                updateData.issueDate = new Date(issueDate);
            }
            if (dueDate !== undefined) {
                updateData.dueDate = dueDate ? new Date(dueDate) : null;
            }
        }

        // Update notes if provided
        if (notes !== undefined) {
            updateData.notes = notes || null;
        }

        // Update attachments if provided
        if (attachments !== undefined) {
            updateData.attachments = attachments ? JSON.stringify(attachments) : null;
        }

        // Update document in database
        const updatedDocument = await prisma.document.update({
            where: {
                id: documentId,
            },
            data: updateData,
        });

        return NextResponse.json(updatedDocument, { status: 200 });

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * DELETE /api/documents/[id]
 * Delete document with protection checks
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const documentId = params.id;

        // Fetch document with justifications
        const document = await prisma.document.findFirst({
            where: {
                id: documentId,
                tenantId, // CRITICAL: Verify tenant ownership
            },
            include: {
                justifications: true,
            },
        });

        if (!document) {
            return NextResponse.json(
                {
                    error: 'DOCUMENT_NOT_FOUND',
                    message: 'Document does not exist or access denied',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Check if document can be deleted (no linked justifications)
        const canDelete = canDeleteDocument(document);
        if (!canDelete.canDelete) {
            return NextResponse.json(
                {
                    error: 'DOCUMENT_HAS_PAYMENTS',
                    message: canDelete.error || 'Cannot delete document with linked payments',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Delete document from database
        await prisma.document.delete({
            where: {
                id: documentId,
            },
        });

        return NextResponse.json(
            {
                message: 'Document deleted successfully',
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}
