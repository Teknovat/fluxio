import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { calculateDocumentStatus, calculateRemainingAmount, sumJustificationAmounts } from '@/lib/document-calculations';
import { calculateDisbursementRemaining } from '@/lib/disbursement-calculations';
import { validatePaymentAmount } from '@/lib/document-validations';

/**
 * GET /api/disbursements/[id]/justifications
 * Fetch all justifications for a disbursement
 * Requirements: 2.10, 5.3, 11.5
 */
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant (Requirement 11.5)
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const { id } = params;

        // Verify disbursement exists and belongs to tenant (Requirement 11.5)
        const disbursement = await prisma.disbursement.findFirst({
            where: {
                id,
                tenantId,
            },
            select: {
                id: true,
            },
        });

        if (!disbursement) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Disbursement not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Fetch all justifications for the disbursement (Requirement 2.10, 5.3)
        const justifications = await prisma.justification.findMany({
            where: {
                disbursementId: id,
                tenantId, // Additional security check
            },
            select: {
                id: true,
                date: true,
                amount: true,
                category: true,
                reference: true,
                note: true,
                attachments: true,
                documentId: true,
                createdBy: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: {
                date: 'asc', // Sort by date ascending (Requirement 5.3)
            },
        });

        return NextResponse.json(justifications, { status: 200 });

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * DELETE /api/disbursements/[id]/justifications?justificationId=xxx
 * Delete a justification and recalculate document amounts
 * Requirements: 4.4, 11.5
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        const { id } = params;
        const { searchParams } = new URL(request.url);
        const justificationId = searchParams.get('justificationId');

        if (!justificationId) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Missing justificationId parameter',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Fetch justification with document info
        const justification = await prisma.justification.findFirst({
            where: {
                id: justificationId,
                disbursementId: id,
                tenantId,
            },
            include: {
                document: true,
            },
        });

        if (!justification) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Justification not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Store document info before deletion
        const linkedDocument = justification.document;
        const justificationAmount = justification.amount;

        // Delete the justification
        await prisma.justification.delete({
            where: { id: justificationId },
        });

        // If justification was linked to a document, recalculate document amounts (Requirement 4.4)
        if (linkedDocument) {
            // Fetch all remaining justifications for this document
            const remainingJustifications = await prisma.justification.findMany({
                where: {
                    documentId: linkedDocument.id,
                },
                select: {
                    amount: true,
                },
            });

            // Calculate new paid amount
            const newPaidAmount = sumJustificationAmounts(remainingJustifications);
            const newRemainingAmount = calculateRemainingAmount(linkedDocument.totalAmount, newPaidAmount);
            const newStatus = calculateDocumentStatus(linkedDocument.totalAmount, newPaidAmount);

            // Update document
            await prisma.document.update({
                where: { id: linkedDocument.id },
                data: {
                    paidAmount: newPaidAmount,
                    remainingAmount: newRemainingAmount,
                    status: newStatus,
                },
            });
        }

        // Recalculate disbursement amounts
        const disbursement = await prisma.disbursement.findUnique({
            where: { id },
            include: {
                justifications: true,
                returns: true,
            },
        });

        if (disbursement) {
            const newRemaining = calculateDisbursementRemaining(disbursement as any);
            const newStatus = newRemaining === 0
                ? 'JUSTIFIED'
                : newRemaining < disbursement.initialAmount
                    ? 'PARTIALLY_JUSTIFIED'
                    : 'OPEN';

            await prisma.disbursement.update({
                where: { id },
                data: {
                    remainingAmount: newRemaining,
                    status: newStatus,
                },
            });
        }

        return NextResponse.json(
            { message: 'Justification deleted successfully' },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * PUT /api/disbursements/[id]/justifications?justificationId=xxx
 * Update a justification and recalculate document amounts
 * Requirements: 4.5, 11.5
 */
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;
        const userId = payload.userId;

        const { id } = params;
        const { searchParams } = new URL(request.url);
        const justificationId = searchParams.get('justificationId');

        if (!justificationId) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Missing justificationId parameter',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Parse request body
        const body = await request.json();
        const { date, amount, category, reference, note, documentId } = body;

        // Fetch existing justification
        const existingJustification = await prisma.justification.findFirst({
            where: {
                id: justificationId,
                disbursementId: id,
                tenantId,
            },
            include: {
                document: true,
            },
        });

        if (!existingJustification) {
            return NextResponse.json(
                {
                    error: 'Not Found',
                    message: 'Justification not found',
                    statusCode: 404,
                },
                { status: 404 }
            );
        }

        // Validate amount if provided
        if (amount !== undefined && amount <= 0) {
            return NextResponse.json(
                {
                    error: 'Bad Request',
                    message: 'Amount must be greater than zero',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        const newAmount = amount !== undefined ? amount : existingJustification.amount;
        const amountChanged = newAmount !== existingJustification.amount;
        const documentChanged = documentId !== existingJustification.documentId;

        // If document is being changed or amount is changing, validate
        let newDocument = null;
        if (documentId) {
            newDocument = await prisma.document.findFirst({
                where: {
                    id: documentId,
                    tenantId,
                },
            });

            if (!newDocument) {
                return NextResponse.json(
                    {
                        error: 'Not Found',
                        message: 'Document not found',
                        statusCode: 404,
                    },
                    { status: 404 }
                );
            }

            // Calculate what the remaining would be if we remove this justification's amount
            let availableAmount = newDocument.remainingAmount;
            if (documentId === existingJustification.documentId) {
                // Same document, add back the old amount
                availableAmount += existingJustification.amount;
            }

            // Validate new amount against available amount (Requirement 4.5)
            const validation = validatePaymentAmount(newAmount, availableAmount);
            if (!validation.isValid) {
                return NextResponse.json(
                    {
                        error: 'Bad Request',
                        message: validation.error,
                        statusCode: 400,
                    },
                    { status: 400 }
                );
            }
        }

        // Update the justification
        const updatedJustification = await prisma.justification.update({
            where: { id: justificationId },
            data: {
                ...(date && { date: new Date(date) }),
                ...(amount !== undefined && { amount: newAmount }),
                ...(category && { category }),
                ...(reference !== undefined && { reference: reference || null }),
                ...(note !== undefined && { note: note || null }),
                ...(documentId !== undefined && { documentId: documentId || null }),
            },
        });

        // Recalculate old document if it was linked and changed (Requirement 4.5)
        if (existingJustification.document && documentChanged) {
            const oldDocJustifications = await prisma.justification.findMany({
                where: {
                    documentId: existingJustification.document.id,
                },
                select: {
                    amount: true,
                },
            });

            const oldDocPaidAmount = sumJustificationAmounts(oldDocJustifications);
            const oldDocRemainingAmount = calculateRemainingAmount(
                existingJustification.document.totalAmount,
                oldDocPaidAmount
            );
            const oldDocStatus = calculateDocumentStatus(
                existingJustification.document.totalAmount,
                oldDocPaidAmount
            );

            await prisma.document.update({
                where: { id: existingJustification.document.id },
                data: {
                    paidAmount: oldDocPaidAmount,
                    remainingAmount: oldDocRemainingAmount,
                    status: oldDocStatus,
                },
            });
        }

        // Recalculate new document if linked (Requirement 4.5)
        if (newDocument && (amountChanged || documentChanged)) {
            const newDocJustifications = await prisma.justification.findMany({
                where: {
                    documentId: newDocument.id,
                },
                select: {
                    amount: true,
                },
            });

            const newDocPaidAmount = sumJustificationAmounts(newDocJustifications);
            const newDocRemainingAmount = calculateRemainingAmount(
                newDocument.totalAmount,
                newDocPaidAmount
            );
            const newDocStatus = calculateDocumentStatus(
                newDocument.totalAmount,
                newDocPaidAmount
            );

            await prisma.document.update({
                where: { id: newDocument.id },
                data: {
                    paidAmount: newDocPaidAmount,
                    remainingAmount: newDocRemainingAmount,
                    status: newDocStatus,
                },
            });
        }

        // Recalculate disbursement if amount changed
        if (amountChanged) {
            const disbursement = await prisma.disbursement.findUnique({
                where: { id },
                include: {
                    justifications: true,
                    returns: true,
                },
            });

            if (disbursement) {
                const newRemaining = calculateDisbursementRemaining(disbursement as any);
                const newStatus = newRemaining === 0
                    ? 'JUSTIFIED'
                    : newRemaining < disbursement.initialAmount
                        ? 'PARTIALLY_JUSTIFIED'
                        : 'OPEN';

                await prisma.disbursement.update({
                    where: { id },
                    data: {
                        remainingAmount: newRemaining,
                        status: newStatus,
                    },
                });
            }
        }

        return NextResponse.json(updatedJustification, { status: 200 });

    } catch (error) {
        return handleAPIError(error);
    }
}
