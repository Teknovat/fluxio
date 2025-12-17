import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAuth } from '@/lib/auth';
import { handleAPIError } from '@/lib/api-errors';
import { DocumentType, DocumentStatus } from '@/types';
import { validateDocumentReference, validateDocumentAmount, validateDocumentDates } from '@/lib/document-validations';
import { calculateRemainingAmount, calculateDocumentStatus } from '@/lib/document-calculations';

/**
 * GET /api/documents
 * Fetch documents with pagination, filtering, sorting, and search
 * Query params: page, limit, status, type, search, sortBy, sortOrder
 */
export async function GET(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

        // Parse query parameters
        const { searchParams } = new URL(request.url);

        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '25');
        const skip = (page - 1) * limit;

        // Filter parameters
        const statusParams = searchParams.getAll('status[]'); // Support array: status[]=UNPAID&status[]=PARTIALLY_PAID
        const typeParam = searchParams.get('type');
        const searchParam = searchParams.get('search');

        // Sort parameters
        const sortBy = searchParams.get('sortBy') || 'dueDate';
        const sortOrder = searchParams.get('sortOrder') || 'asc';

        // Build filter object - ALWAYS filter by tenantId
        const where: any = {
            tenantId, // CRITICAL: Filter by tenant
        };

        // Filter by status if provided (supports multiple statuses)
        if (statusParams.length > 0) {
            const validStatuses = statusParams.filter(status =>
                Object.values(DocumentStatus).includes(status as DocumentStatus)
            );
            if (validStatuses.length > 0) {
                where.status = { in: validStatuses };
            }
        }

        // Filter by type if provided
        if (typeParam && Object.values(DocumentType).includes(typeParam as DocumentType)) {
            where.type = typeParam;
        }

        // Search in reference and notes
        if (searchParam) {
            where.OR = [
                { reference: { contains: searchParam, mode: 'insensitive' } },
                { notes: { contains: searchParam, mode: 'insensitive' } },
            ];
        }

        // Build sort object
        const orderBy: any = {};
        if (sortBy === 'dueDate') {
            orderBy.dueDate = sortOrder;
        } else if (sortBy === 'totalAmount') {
            orderBy.totalAmount = sortOrder;
        } else if (sortBy === 'remainingAmount') {
            orderBy.remainingAmount = sortOrder;
        } else {
            orderBy.dueDate = 'asc'; // Default sort
        }

        // Get total count for pagination
        const total = await prisma.document.count({ where });

        // Fetch filtered documents from database with pagination
        const documents = await prisma.document.findMany({
            where,
            orderBy,
            skip,
            take: limit,
        });

        return NextResponse.json(
            {
                documents,
                pagination: {
                    page,
                    limit,
                    total,
                    totalPages: Math.ceil(total / limit),
                },
            },
            { status: 200 }
        );

    } catch (error) {
        return handleAPIError(error);
    }
}

/**
 * POST /api/documents
 * Create a new document
 * Validates input and creates document in database
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authentication and get tenant
        const payload = await requireAuth(request);
        const tenantId = payload.tenantId;

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

        // Validate required fields
        if (!type || !reference || totalAmount === undefined || !issueDate) {
            return NextResponse.json(
                {
                    error: 'Validation Error',
                    message: 'Missing required fields: type, reference, totalAmount, issueDate',
                    statusCode: 400,
                },
                { status: 400 }
            );
        }

        // Validate document type
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

        // Validate reference uniqueness
        const referenceValidation = await validateDocumentReference(reference, tenantId);
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

        // Validate amount
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

        // Validate dates
        const datesValidation = validateDocumentDates(issueDate, dueDate);
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

        // Calculate initial values
        const paidAmount = 0;
        const remainingAmount = calculateRemainingAmount(totalAmount, paidAmount);
        const status = calculateDocumentStatus(totalAmount, paidAmount);

        // Create document in database
        const newDocument = await prisma.document.create({
            data: {
                tenantId, // CRITICAL: Set tenant
                type,
                reference,
                totalAmount,
                paidAmount,
                remainingAmount,
                status,
                issueDate: new Date(issueDate),
                dueDate: dueDate ? new Date(dueDate) : null,
                notes: notes || null,
                attachments: attachments ? JSON.stringify(attachments) : null,
            },
        });

        return NextResponse.json(newDocument, { status: 201 });

    } catch (error) {
        return handleAPIError(error);
    }
}
