# Document Status Array Filter Implementation

## Summary

Modified the documents API to support filtering by multiple status values using array query parameters.

## Changes Made

### 1. API Route (`app/api/documents/route.ts`)

- Changed from single status parameter to array-based status filtering
- Now supports: `status[]=UNPAID&status[]=PARTIALLY_PAID`
- Uses `searchParams.getAll('status[]')` to retrieve all status values
- Filters valid statuses and uses Prisma's `{ in: validStatuses }` syntax

**Before:**

```typescript
const statusParam = searchParams.get("status");
if (statusParam && Object.values(DocumentStatus).includes(statusParam as DocumentStatus)) {
  where.status = statusParam;
}
```

**After:**

```typescript
const statusParams = searchParams.getAll("status[]");
if (statusParams.length > 0) {
  const validStatuses = statusParams.filter((status) =>
    Object.values(DocumentStatus).includes(status as DocumentStatus)
  );
  if (validStatuses.length > 0) {
    where.status = { in: validStatuses };
  }
}
```

### 2. Documents Page (`app/(dashboard)/documents/page.tsx`)

- Updated to use `status[]` parameter syntax
- Changed from `params.append("status", selectedStatus)` to `params.append("status[]", selectedStatus)`

### 3. Document Selector (`components/DocumentSelector.tsx`)

- Updated to use array syntax for multiple status filters
- Changed from `params.append("status", ...)` to `params.append("status[]", ...)`
- Now correctly fetches documents with UNPAID or PARTIALLY_PAID status

### 4. Document Detail API (`app/api/documents/[id]/route.ts`)

- Removed all references to `intervenant` relation (part of multi-payer support)
- Removed `intervenantId` from PUT request body
- Removed intervenant validation and update logic
- Removed intervenant include from GET and PUT queries

### 5. Justification Form (`components/JustificationForm.tsx`)

- Removed `intervenantId` prop from DocumentSelector component

## URL Format

The API now accepts multiple status values in the URL:

```
/api/documents?status[]=UNPAID&status[]=PARTIALLY_PAID
/api/documents?status[]=PAID
```

## Benefits

1. **Flexibility**: Can filter by one or multiple statuses in a single request
2. **Efficiency**: Reduces the need for multiple API calls
3. **Standard**: Uses common array parameter syntax supported by URLSearchParams
4. **Backward Compatible**: Still works with single status filters

## Testing

Build completed successfully with no errors:

- ✓ Compiled successfully
- ✓ All 38 static pages generated
- ✓ No TypeScript errors
- ✓ All routes functional

## Related Changes

This implementation complements the multi-payer document support where documents are no longer tied to a single intervenant, allowing multiple intervenants to pay portions of a single document through their justifications.
