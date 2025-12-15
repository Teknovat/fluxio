# Implementation Plan - Document Tracking System

- [x] 1. Update database schema and types

  - Add Document model to Prisma schema
  - Add documentId field to Justification model
  - Create TypeScript interfaces for Document types
  - Run database migration
  - _Requirements: 1.1, 11.1_

- [x] 2. Implement document calculation functions

  - Create `lib/document-calculations.ts` with calculation utilities
  - Implement `calculateRemainingAmount(totalAmount, paidAmount)`
  - Implement `calculateDocumentStatus(totalAmount, paidAmount)`
  - Implement `calculatePaymentPercentage(totalAmount, paidAmount)`
  - Implement `sumJustificationAmounts(justifications)`
  - _Requirements: 1.2, 4.1, 4.2, 4.3_

- [ ]\* 2.1 Write property test for amount calculations

  - **Property 1: Document amount consistency**
  - **Validates: Requirements 1.2, 3.5**

- [x] 3. Implement document validation functions

  - Create `lib/document-validations.ts` with validation utilities
  - Implement `validateDocumentReference(reference, tenantId, excludeId?)`
  - Implement `validateDocumentAmount(amount)`
  - Implement `validateDocumentDates(issueDate, dueDate?)`
  - Implement `validatePaymentAmount(amount, remainingAmount)`
  - Implement `canDeleteDocument(document)`
  - Implement `canModifyTotalAmount(newAmount, paidAmount)`
  - _Requirements: 1.3, 1.4, 3.2, 8.2, 8.4_

- [ ]\* 3.1 Write property test for validation functions

  - **Property 2: Payment validation**
  - **Validates: Requirements 3.2, 3.3, 7.3**

- [ ]\* 3.2 Write property test for status correctness

  - **Property 3: Status correctness**
  - **Validates: Requirements 4.1, 4.2, 4.3**

- [x] 4. Create Document API endpoints

  - Create `app/api/documents/route.ts` for GET (list) and POST (create)
  - Implement GET with pagination, filtering, sorting, and search
  - Implement POST with validation and file upload support
  - Add tenant isolation checks
  - Add error handling
  - _Requirements: 1.1, 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 10.4, 11.1, 11.2_

- [x] 4.1 Create single document API endpoints

  - Create `app/api/documents/[id]/route.ts` for GET, PUT, DELETE
  - Implement GET with payment history
  - Implement PUT with validation
  - Implement DELETE with protection checks
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 8.1, 8.2, 8.3, 8.4, 8.5, 11.4_

- [x] 4.2 Create document statistics API

  - Create `app/api/documents/stats/route.ts`
  - Calculate unpaid documents count and amount
  - Calculate overdue documents count and amount
  - Calculate documents due within 7 days
  - Calculate partially paid documents count
  - _Requirements: 9.1, 9.2, 9.3, 9.4_

- [ ]\* 4.3 Write property test for tenant isolation

  - **Property 7: Tenant isolation**
  - **Validates: Requirements 11.1, 11.2, 11.3, 11.4**

- [ ]\* 4.4 Write property test for reference uniqueness

  - **Property 8: Reference uniqueness**
  - **Validates: Requirements 1.3**

- [x] 5. Update Justification API to support documents

  - Modify `app/api/disbursements/[id]/justifications/route.ts`
  - Add optional documentId parameter
  - Validate payment amount against document remaining amount
  - Update document paid amount when justification is created
  - Recalculate document status
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 5.1 Update justification deletion to handle documents

  - Modify DELETE endpoint in justifications API
  - Recalculate document paid amount when justification is deleted
  - Recalculate document remaining amount and status
  - _Requirements: 4.4_

- [x] 5.2 Update justification modification to handle documents

  - Modify PUT endpoint in justifications API
  - Validate new amount against document remaining amount
  - Recalculate document paid amount when justification is modified
  - Recalculate document remaining amount and status
  - _Requirements: 4.5_

- [ ]\* 5.3 Write property test for payment recalculation

  - **Property 4: Payment recalculation**
  - **Validates: Requirements 4.4, 4.5**

- [ ]\* 5.4 Write property test for payment sum consistency

  - **Property 10: Payment sum consistency**
  - **Validates: Requirements 3.4, 3.5**

- [x] 6. Create DocumentForm component

  - Create `components/DocumentForm.tsx`
  - Implement form fields (type, reference, intervenant, amounts, dates, notes)
  - Add file upload for attachments
  - Implement validation (client-side)
  - Handle create and edit modes
  - Add success/error toast notifications
  - _Requirements: 1.1, 1.3, 1.4, 6.1, 6.2, 6.3, 12.1, 12.2, 12.3_

- [x] 7. Create DocumentList component

  - Create `app/(dashboard)/documents/page.tsx`
  - Implement document list with pagination
  - Add filters (status, type, intervenant, date range)
  - Add search functionality
  - Add sort options
  - Display document cards with status badges
  - Add quick actions (view, edit, delete)
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 10.1, 10.2, 10.3, 10.4, 10.5_

- [x] 8. Create DocumentDetail component

  - Create `app/(dashboard)/documents/[id]/page.tsx`
  - Display document header with all information
  - Show payment progress bar
  - Display payment statistics
  - List linked justifications with details
  - Show attachments with download links
  - Add action buttons (edit, delete, add payment)
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 12.4_

- [x] 9. Create DocumentCard component

  - Create `components/DocumentCard.tsx`
  - Display document type icon
  - Show reference and intervenant name
  - Display status badge (color-coded)
  - Show total amount and remaining amount
  - Display due date with overdue indicator
  - Add progress bar
  - Include quick action buttons
  - _Requirements: 2.1, 6.4_

- [x] 10. Create DocumentSelector component

  - Create `components/DocumentSelector.tsx`
  - Implement document search by reference
  - Filter by intervenant
  - Show only documents with remaining amount > 0
  - Display reference, type, and remaining amount
  - Highlight selected document
  - _Requirements: 3.1, 7.1_

- [x] 11. Update JustificationForm to support documents

  - Modify `components/JustificationForm.tsx`
  - Add optional DocumentSelector
  - Display document remaining amount when selected
  - Show warning if amount exceeds remaining
  - Validate amount against document remaining amount
  - _Requirements: 3.1, 3.2, 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 12. Create DocumentStats dashboard widget

  - Create `components/DocumentStats.tsx`
  - Display unpaid documents count and amount
  - Display overdue documents count and amount
  - Display documents due within 7 days
  - Display partially paid documents count
  - Add click-through to filtered document lists
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 13. Integrate DocumentStats into dashboard

  - Modify `app/(dashboard)/dashboard/page.tsx`
  - Add DocumentStats widget
  - Position appropriately in dashboard layout
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 14. Add documents link to navigation

  - Modify `app/(dashboard)/layout.tsx`
  - Add "Documents" navigation item
  - Add appropriate icon
  - _Requirements: 2.1_

- [x] 15. Add documents section to intervenant detail page

  - Modify `app/(dashboard)/intervenants/[id]/page.tsx`
  - Display list of documents for the intervenant
  - Show document status and amounts
  - Add link to document detail
  - _Requirements: 2.4, 5.4_

- [ ]\* 16. Write property test for deletion protection

  - **Property 5: Deletion protection**
  - **Validates: Requirements 8.4**

- [ ]\* 17. Write property test for amount modification protection

  - **Property 6: Total amount modification protection**
  - **Validates: Requirements 8.2**

- [ ]\* 18. Write property test for amount positivity

  - **Property 9: Amount positivity**
  - **Validates: Requirements 1.4**

- [ ] 19. Checkpoint - Ensure all tests pass

  - Ensure all tests pass, ask the user if questions arise.

- [ ] 20. Create file upload utility

  - Create `lib/file-upload.ts`
  - Implement file validation (type, size)
  - Implement file storage (filesystem or S3)
  - Implement file deletion
  - Generate unique file names
  - _Requirements: 12.1, 12.2, 12.3, 12.5_

- [ ] 21. Add file attachment support to Document API

  - Update POST /api/documents to handle file uploads
  - Update PUT /api/documents to handle file uploads
  - Update DELETE /api/documents to delete associated files
  - Store file paths in document.attachments JSON field
  - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5_

- [ ] 22. Add file download endpoint

  - Create `app/api/documents/[id]/files/[filename]/route.ts`
  - Implement secure file download
  - Verify user has access to document
  - Set appropriate content-type headers
  - _Requirements: 12.4_

- [ ] 23. Update DocumentForm to handle file uploads

  - Add file input field
  - Implement file preview
  - Show upload progress
  - Handle multiple files
  - Display validation errors
  - _Requirements: 12.1, 12.2, 12.3_

- [ ] 24. Update DocumentDetail to display attachments

  - List all attached files
  - Add download buttons
  - Show file type icons
  - Display file sizes
  - _Requirements: 12.4_

- [ ] 25. Final Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.
