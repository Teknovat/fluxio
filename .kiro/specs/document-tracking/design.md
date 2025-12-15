# Design Document - Document Tracking System

## Overview

The Document Tracking System extends Fluxio's cash management capabilities by introducing a document-centric approach to tracking financial obligations. Instead of treating each justification independently, the system allows users to create source documents (invoices, payslips, purchase orders) and link multiple justifications to them, providing complete traceability and preventing over-payments.

**Key Benefits:**

- Complete payment history per document
- Automatic calculation of remaining amounts
- Prevention of over-payments through validation
- Clear visibility of payment obligations
- Support for partial and multiple payments

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend Layer                        │
├─────────────────────────────────────────────────────────────┤
│  DocumentList    DocumentForm    DocumentDetail             │
│  DocumentCard    DocumentSelector  DocumentStats            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                         API Layer                            │
├─────────────────────────────────────────────────────────────┤
│  /api/documents          - CRUD operations                   │
│  /api/documents/[id]     - Single document operations        │
│  /api/documents/stats    - Dashboard statistics              │
│  /api/documents/search   - Search and filter                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Business Logic                          │
├─────────────────────────────────────────────────────────────┤
│  lib/document-calculations.ts  - Payment calculations        │
│  lib/document-validations.ts   - Business rules             │
│  lib/document-status.ts        - Status management          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
├─────────────────────────────────────────────────────────────┤
│  Document Model                                              │
│  DocumentPayment Model (junction table)                      │
│  Modified Justification Model (add documentId)              │
└─────────────────────────────────────────────────────────────┘
```

### Integration Points

1. **Justification System**: Modified to support optional document linking
2. **Disbursement System**: Enhanced to show related documents
3. **Dashboard**: New widgets for document statistics
4. **Intervenant Pages**: Show documents per intervenant

## Components and Interfaces

### Frontend Components

#### 1. DocumentList Component

**Purpose**: Display paginated list of documents with filters

**Props**:

```typescript
interface DocumentListProps {
  initialFilters?: {
    status?: DocumentStatus;
    type?: DocumentType;
    intervenantId?: string;
  };
}
```

**Features**:

- Pagination (25 items per page)
- Filters: status, type, intervenant, date range
- Search by reference or intervenant name
- Sort by: due date, total amount, remaining amount
- Quick actions: view, edit, delete

#### 2. DocumentForm Component

**Purpose**: Create/edit documents

**Props**:

```typescript
interface DocumentFormProps {
  documentId?: string; // For edit mode
  intervenantId?: string; // Pre-select intervenant
  onSuccess?: (document: Document) => void;
}
```

**Fields**:

- Type (select: INVOICE, PAYSLIP, PURCHASE_ORDER, CONTRACT, OTHER)
- Reference (text, required)
- Intervenant (select, required)
- Total Amount (number, required, > 0)
- Issue Date (date, required)
- Due Date (date, optional)
- Notes (textarea, optional)
- Attachments (file upload, multiple, PDF/JPG/PNG, max 10MB each)

**Validation**:

- Reference must be unique per tenant
- Total amount cannot be less than paid amount (edit mode)
- Due date must be after issue date

#### 3. DocumentDetail Component

**Purpose**: Show document details with payment history

**Sections**:

- Document header (reference, type, intervenant, dates)
- Payment progress bar (visual representation of paid/remaining)
- Payment statistics (total, paid, remaining, percentage)
- Linked justifications table (date, amount, category, reference, actions)
- Attachments list (download links)
- Action buttons (edit, delete, add payment)

#### 4. DocumentSelector Component

**Purpose**: Select document when creating justification

**Props**:

```typescript
interface DocumentSelectorProps {
  intervenantId?: string; // Filter by intervenant
  onSelect: (document: Document) => void;
  selectedDocumentId?: string;
}
```

**Features**:

- Search documents by reference
- Filter by intervenant (if not pre-filtered)
- Show only documents with remaining amount > 0
- Display: reference, type, remaining amount
- Highlight selected document

#### 5. DocumentCard Component

**Purpose**: Display document summary in lists

**Content**:

- Document type icon
- Reference and intervenant name
- Status badge (color-coded)
- Total amount and remaining amount
- Due date (with overdue indicator)
- Progress bar
- Quick action buttons

#### 6. DocumentStats Component

**Purpose**: Dashboard widget showing document statistics

**Metrics**:

- Total unpaid documents count and amount
- Overdue documents count and amount
- Documents due within 7 days
- Partially paid documents count
- Click-through to filtered lists

### API Endpoints

#### GET /api/documents

**Purpose**: List documents with pagination and filters

**Query Parameters**:

- `page` (number, default: 1)
- `limit` (number, default: 25)
- `status` (UNPAID | PARTIALLY_PAID | PAID)
- `type` (INVOICE | PAYSLIP | PURCHASE_ORDER | CONTRACT | OTHER)
- `intervenantId` (string)
- `search` (string)
- `sortBy` (dueDate | totalAmount | remainingAmount)
- `sortOrder` (asc | desc)

**Response**:

```typescript
{
  documents: Document[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

#### POST /api/documents

**Purpose**: Create new document

**Request Body**:

```typescript
{
  type: DocumentType;
  reference: string;
  intervenantId: string;
  totalAmount: number;
  issueDate: string; // ISO date
  dueDate?: string; // ISO date
  notes?: string;
  attachments?: string[]; // File paths
}
```

**Response**: Created document object

**Validation**:

- Reference unique per tenant
- Total amount > 0
- Intervenant exists and belongs to tenant
- Due date after issue date

#### GET /api/documents/[id]

**Purpose**: Get single document with payment history

**Response**:

```typescript
{
  document: Document;
  payments: Array<{
    justification: Justification;
    disbursement: Disbursement;
    intervenant: Intervenant;
  }>;
}
```

#### PUT /api/documents/[id]

**Purpose**: Update document

**Request Body**: Same as POST (partial updates allowed)

**Validation**:

- Cannot reduce total amount below paid amount
- Cannot change intervenant if payments exist

#### DELETE /api/documents/[id]

**Purpose**: Delete document

**Validation**:

- Cannot delete if payments exist
- Must cascade delete attachments

#### GET /api/documents/stats

**Purpose**: Get dashboard statistics

**Response**:

```typescript
{
  unpaid: {
    count: number;
    amount: number;
  }
  overdue: {
    count: number;
    amount: number;
  }
  dueWithin7Days: {
    count: number;
    amount: number;
  }
  partiallyPaid: {
    count: number;
    amount: number;
  }
}
```

#### GET /api/documents/search

**Purpose**: Search documents

**Query Parameters**:

- `q` (string, required)
- `limit` (number, default: 10)

**Response**: Array of matching documents

## Data Models

### Document Model

```prisma
model Document {
  id              String            @id @default(cuid())
  tenantId        String
  type            String            // INVOICE, PAYSLIP, PURCHASE_ORDER, CONTRACT, OTHER
  reference       String            // Unique per tenant
  intervenantId   String
  intervenant     Intervenant       @relation(fields: [intervenantId], references: [id], onDelete: Restrict)
  totalAmount     Float
  paidAmount      Float             @default(0)
  remainingAmount Float             // Calculated: totalAmount - paidAmount
  status          String            @default("UNPAID") // UNPAID, PARTIALLY_PAID, PAID
  issueDate       DateTime
  dueDate         DateTime?
  notes           String?
  attachments     String?           // JSON array of file paths
  justifications  Justification[]   @relation("DocumentJustifications")
  createdAt       DateTime          @default(now())
  updatedAt       DateTime          @updatedAt

  @@unique([tenantId, reference])
  @@index([tenantId])
  @@index([tenantId, status])
  @@index([tenantId, intervenantId])
  @@index([tenantId, type])
  @@index([status])
  @@index([dueDate])
}
```

### Modified Justification Model

```prisma
model Justification {
  id             String       @id @default(cuid())
  tenantId       String
  disbursementId String
  disbursement   Disbursement @relation(fields: [disbursementId], references: [id], onDelete: Cascade)
  documentId     String?      // NEW: Optional link to document
  document       Document?    @relation("DocumentJustifications", fields: [documentId], references: [id], onDelete: SetNull)
  date           DateTime
  amount         Float
  category       String
  reference      String?
  note           String?
  attachments    String?
  createdBy      String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([tenantId])
  @@index([disbursementId])
  @@index([documentId])  // NEW
  @@index([date])
}
```

### TypeScript Interfaces

```typescript
export enum DocumentType {
  INVOICE = "INVOICE",
  PAYSLIP = "PAYSLIP",
  PURCHASE_ORDER = "PURCHASE_ORDER",
  CONTRACT = "CONTRACT",
  OTHER = "OTHER",
}

export enum DocumentStatus {
  UNPAID = "UNPAID",
  PARTIALLY_PAID = "PARTIALLY_PAID",
  PAID = "PAID",
}

export interface Document {
  id: string;
  tenantId: string;
  type: DocumentType;
  reference: string;
  intervenantId: string;
  intervenant?: Intervenant;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: DocumentStatus;
  issueDate: Date;
  dueDate?: Date;
  notes?: string;
  attachments?: string[];
  justifications?: Justification[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentWithPayments extends Document {
  payments: Array<{
    justification: Justification;
    disbursement: Disbursement;
    intervenant: Intervenant;
  }>;
}

export interface DocumentStats {
  unpaid: { count: number; amount: number };
  overdue: { count: number; amount: number };
  dueWithin7Days: { count: number; amount: number };
  partiallyPaid: { count: number; amount: number };
}
```

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Property 1: Document amount consistency

_For any_ document, the remaining amount must always equal the total amount minus the paid amount.
**Validates: Requirements 1.2, 3.5**

### Property 2: Payment validation

_For any_ justification linked to a document, the justification amount must not exceed the document's remaining amount at the time of linking.
**Validates: Requirements 3.2, 3.3, 7.3**

### Property 3: Status correctness

_For any_ document, if paid amount equals zero then status must be UNPAID, if paid amount equals total amount then status must be PAID, otherwise status must be PARTIALLY_PAID.
**Validates: Requirements 4.1, 4.2, 4.3**

### Property 4: Payment recalculation

_For any_ document, when a linked justification is deleted or modified, the document's paid amount, remaining amount, and status must be recalculated correctly.
**Validates: Requirements 4.4, 4.5**

### Property 5: Deletion protection

_For any_ document with linked justifications, deletion attempts must be rejected.
**Validates: Requirements 8.4**

### Property 6: Total amount modification protection

_For any_ document with linked justifications, attempts to modify the total amount to less than the paid amount must be rejected.
**Validates: Requirements 8.2**

### Property 7: Tenant isolation

_For any_ document operation, only documents belonging to the user's tenant must be accessible.
**Validates: Requirements 11.1, 11.2, 11.3, 11.4**

### Property 8: Reference uniqueness

_For any_ tenant, no two documents can have the same reference.
**Validates: Requirements 1.3**

### Property 9: Amount positivity

_For any_ document, the total amount must be greater than zero.
**Validates: Requirements 1.4**

### Property 10: Payment sum consistency

_For any_ document, the sum of all linked justification amounts must equal the document's paid amount.
**Validates: Requirements 3.4, 3.5**

## Error Handling

### Validation Errors

1. **DOCUMENT_REFERENCE_EXISTS**: Reference already exists for this tenant
2. **DOCUMENT_INVALID_AMOUNT**: Total amount must be greater than zero
3. **DOCUMENT_INVALID_DATES**: Due date must be after issue date
4. **DOCUMENT_NOT_FOUND**: Document does not exist or access denied
5. **DOCUMENT_HAS_PAYMENTS**: Cannot delete document with linked payments
6. **DOCUMENT_AMOUNT_TOO_LOW**: Cannot reduce total amount below paid amount
7. **PAYMENT_EXCEEDS_REMAINING**: Justification amount exceeds document remaining amount
8. **DOCUMENT_FULLY_PAID**: Cannot add payment to fully paid document
9. **INVALID_FILE_TYPE**: File must be PDF, JPG, or PNG
10. **FILE_TOO_LARGE**: File size exceeds 10MB limit

### Error Response Format

```typescript
{
  error: string;
  message: string;
  statusCode: number;
  details?: any;
}
```

## Testing Strategy

### Unit Tests

1. **Document calculations**:

   - Test remaining amount calculation
   - Test status determination
   - Test payment sum validation

2. **Validation functions**:

   - Test reference uniqueness check
   - Test amount validation
   - Test date validation
   - Test payment amount validation

3. **API endpoints**:
   - Test CRUD operations
   - Test pagination
   - Test filtering and search
   - Test error responses

### Property-Based Tests

Property-based tests will use **fast-check** library for TypeScript, configured to run minimum 100 iterations per test.

Each property test must be tagged with: `**Feature: document-tracking, Property {number}: {property_text}**`

1. **Property 1 Test**: Generate random documents, verify remainingAmount = totalAmount - paidAmount
2. **Property 2 Test**: Generate random justifications and documents, verify payment validation
3. **Property 3 Test**: Generate random documents with various paid amounts, verify status correctness
4. **Property 4 Test**: Generate documents with payments, delete/modify payments, verify recalculation
5. **Property 5 Test**: Generate documents with payments, attempt deletion, verify rejection
6. **Property 6 Test**: Generate documents with payments, attempt to reduce total amount, verify rejection
7. **Property 7 Test**: Generate multi-tenant data, verify tenant isolation
8. **Property 8 Test**: Generate documents, verify reference uniqueness per tenant
9. **Property 9 Test**: Attempt to create documents with zero/negative amounts, verify rejection
10. **Property 10 Test**: Generate documents with multiple payments, verify sum equals paid amount

### Integration Tests

1. **End-to-end document lifecycle**:

   - Create document
   - Add multiple payments
   - Verify status transitions
   - Delete payments
   - Delete document

2. **Justification-document linking**:

   - Create justification without document
   - Create justification with document
   - Verify document updates
   - Unlink justification
   - Verify document recalculation

3. **Dashboard statistics**:
   - Create various documents
   - Verify statistics accuracy
   - Filter by status/type
   - Verify counts and amounts

## Security Considerations

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Users can only access documents from their tenant
3. **Input Validation**: All inputs sanitized and validated
4. **File Upload**: Strict file type and size validation
5. **SQL Injection**: Prisma ORM prevents SQL injection
6. **XSS Prevention**: React automatically escapes output

## Performance Considerations

1. **Database Indexes**: Added on frequently queried fields (tenantId, status, type, dueDate)
2. **Pagination**: Default 25 items per page to limit data transfer
3. **Eager Loading**: Use Prisma `include` to avoid N+1 queries
4. **Caching**: Consider caching document statistics (5-minute TTL)
5. **File Storage**: Store attachments outside database (filesystem or S3)

## Migration Strategy

### Phase 1: Database Schema

1. Create Document model
2. Add documentId to Justification model
3. Run migration

### Phase 2: Backend Implementation

1. Implement document CRUD APIs
2. Implement calculation functions
3. Implement validation functions
4. Add property-based tests

### Phase 3: Frontend Implementation

1. Create document components
2. Integrate with justification forms
3. Add dashboard widgets
4. Add navigation links

### Phase 4: Data Migration (if needed)

1. No existing data to migrate
2. Users will create documents going forward

## Future Enhancements

1. **Recurring Documents**: Auto-create monthly payslips
2. **Document Templates**: Pre-fill common document types
3. **Email Notifications**: Alert when documents are overdue
4. **Bulk Operations**: Pay multiple documents at once
5. **Document Approval Workflow**: Require approval before payment
6. **OCR Integration**: Extract data from uploaded invoices
7. **Export**: Export document list to Excel/PDF
