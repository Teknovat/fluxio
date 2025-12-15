# Task 5 Implementation Complete: Justification API Document Support

## Summary

Successfully implemented document tracking support in the Justification API, allowing justifications to be linked to documents and automatically updating document payment status.

## Changes Made

### 1. Updated POST /api/disbursements/[id]/justify

**File**: `app/api/disbursements/[id]/justify/route.ts`

**New Features**:

- Added optional `documentId` parameter to request body (Requirement 3.1)
- Validates document exists and belongs to same tenant
- Validates payment amount against document remaining amount (Requirement 3.2, 3.3)
- Links justification to document when creating
- Updates document `paidAmount`, `remainingAmount`, and `status` after justification creation (Requirement 3.4, 3.5)

**Validation Logic**:

```typescript
// Validates payment doesn't exceed document remaining amount
const validation = validatePaymentAmount(amount, document.remainingAmount);
if (!validation.isValid) {
    return error response
}
```

**Document Update Logic**:

```typescript
const newPaidAmount = document.paidAmount + amount;
const newRemainingAmount = calculateRemainingAmount(document.totalAmount, newPaidAmount);
const newDocumentStatus = calculateDocumentStatus(document.totalAmount, newPaidAmount);

await prisma.document.update({
  where: { id: documentId },
  data: {
    paidAmount: newPaidAmount,
    remainingAmount: newRemainingAmount,
    status: newDocumentStatus,
  },
});
```

### 2. Updated GET /api/disbursements/[id]/justifications

**File**: `app/api/disbursements/[id]/justifications/route.ts`

**Changes**:

- Added `documentId` to the select fields in the response
- Allows clients to see which justifications are linked to documents

### 3. Added DELETE /api/disbursements/[id]/justifications

**File**: `app/api/disbursements/[id]/justifications/route.ts`

**New Endpoint**: `DELETE /api/disbursements/[id]/justifications?justificationId=xxx`

**Features** (Requirement 4.4):

- Deletes a justification
- If justification was linked to a document:
  - Fetches all remaining justifications for that document
  - Recalculates document `paidAmount` by summing remaining justifications
  - Recalculates document `remainingAmount` and `status`
  - Updates document in database
- Recalculates disbursement amounts and status

**Recalculation Logic**:

```typescript
// Fetch remaining justifications after deletion
const remainingJustifications = await prisma.justification.findMany({
  where: { documentId: linkedDocument.id },
  select: { amount: true },
});

// Recalculate document amounts
const newPaidAmount = sumJustificationAmounts(remainingJustifications);
const newRemainingAmount = calculateRemainingAmount(linkedDocument.totalAmount, newPaidAmount);
const newStatus = calculateDocumentStatus(linkedDocument.totalAmount, newPaidAmount);
```

### 4. Added PUT /api/disbursements/[id]/justifications

**File**: `app/api/disbursements/[id]/justifications/route.ts`

**New Endpoint**: `PUT /api/disbursements/[id]/justifications?justificationId=xxx`

**Features** (Requirement 4.5):

- Updates justification fields (date, amount, category, reference, note, documentId)
- Validates new amount against document remaining amount
- Handles three scenarios:
  1. **Amount changed on same document**: Recalculates document amounts
  2. **Document changed**: Recalculates both old and new documents
  3. **Document unlinked**: Recalculates old document only
- Recalculates disbursement amounts if justification amount changed

**Smart Validation**:

```typescript
// Calculate available amount considering if same document
let availableAmount = newDocument.remainingAmount;
if (documentId === existingJustification.documentId) {
  // Same document, add back the old amount
  availableAmount += existingJustification.amount;
}

const validation = validatePaymentAmount(newAmount, availableAmount);
```

## Requirements Validated

### Task 5 Requirements

- ✅ **3.1**: Allow selecting optional document when creating justification
- ✅ **3.2**: Verify justification amount doesn't exceed document remaining amount
- ✅ **3.3**: Reject operation if amount exceeds remaining with error message
- ✅ **3.4**: Update document paid amount by adding justification amount
- ✅ **3.5**: Recalculate document remaining amount as total minus paid

### Subtask 5.1 Requirements

- ✅ **4.4**: Recalculate document paid amount, remaining amount, and status when justification deleted

### Subtask 5.2 Requirements

- ✅ **4.5**: Recalculate document paid amount, remaining amount, and status when justification modified

## Testing

Created comprehensive integration tests in `lib/justification-document-integration.test.ts`:

**Test Coverage**:

- ✅ Payment validation against remaining amount
- ✅ Document amount calculations
- ✅ Document status transitions (UNPAID → PARTIALLY_PAID → PAID)
- ✅ Payment recalculation after adding payment
- ✅ Payment recalculation after deleting payment
- ✅ Payment recalculation after modifying payment
- ✅ Multiple partial payments workflow
- ✅ Status transitions when payments are added/removed

**Test Results**: All 16 tests passing ✅

## API Usage Examples

### Create Justification with Document Link

```typescript
POST /api/disbursements/{disbursementId}/justify
{
    "date": "2024-01-15",
    "amount": 2500,
    "category": "STOCK_PURCHASE",
    "reference": "INV-001",
    "note": "Payment for invoice",
    "documentId": "doc_123" // Optional
}
```

### Update Justification Amount

```typescript
PUT /api/disbursements/{disbursementId}/justifications?justificationId=just_456
{
    "amount": 3000 // New amount
}
```

### Delete Justification

```typescript
DELETE /api/disbursements/{disbursementId}/justifications?justificationId=just_456
```

## Database Schema

The implementation uses the existing Prisma schema with:

- `Justification.documentId` (optional foreign key to Document)
- `Document.paidAmount` (calculated field)
- `Document.remainingAmount` (calculated field)
- `Document.status` (UNPAID | PARTIALLY_PAID | PAID)

## Next Steps

The following tasks are now ready to be implemented:

- Task 6: Create DocumentForm component
- Task 7: Create DocumentList component
- Task 8: Create DocumentDetail component
- Task 11: Update JustificationForm to support documents

## Notes

- The TypeScript language server may show cached errors for the Prisma client types, but the code compiles and runs correctly
- All document recalculations use the helper functions from `lib/document-calculations.ts`
- All validations use the helper functions from `lib/document-validations.ts`
- The implementation maintains backward compatibility - documentId is optional
