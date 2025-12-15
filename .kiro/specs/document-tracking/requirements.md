# Requirements Document - Document Tracking System

## Introduction

Ce document définit les exigences pour un système de gestion de documents financiers (factures, bulletins de salaire, etc.) permettant de suivre les paiements partiels et multiples liés à un même document source. Le système permet de lier les justifications de décaissements à des documents, assurant une traçabilité complète et évitant les sur-paiements.

## Glossary

- **System**: Le système de gestion de trésorerie Fluxio
- **Document**: Un document financier source (facture, bulletin de salaire, bon de commande) ayant un montant total à payer
- **Justification**: Une justification de décaissement existante dans le système
- **Disbursement**: Un décaissement de fonds nécessitant justification
- **Intervenant**: Une entité (fournisseur, collaborateur, associé) liée à un document
- **Payment**: Un paiement partiel ou total effectué sur un document via une justification
- **Tenant**: Une organisation utilisant le système

## Requirements

### Requirement 1

**User Story:** As a user, I want to create financial documents with total amounts, so that I can track payments against these documents over time.

#### Acceptance Criteria

1. WHEN a user creates a document THEN the System SHALL store the document type, reference number, total amount, issue date, due date, intervenant, and optional notes
2. WHEN a user creates a document THEN the System SHALL initialize the paid amount to zero and remaining amount to the total amount
3. WHEN a user creates a document with an empty reference THEN the System SHALL reject the creation and display an error message
4. WHEN a user creates a document with a negative or zero total amount THEN the System SHALL reject the creation and display an error message
5. WHEN a user creates a document THEN the System SHALL set the status to UNPAID

### Requirement 2

**User Story:** As a user, I want to view all documents with their payment status, so that I can see which documents are fully paid, partially paid, or unpaid.

#### Acceptance Criteria

1. WHEN a user views the documents list THEN the System SHALL display all documents with reference, type, intervenant name, total amount, paid amount, remaining amount, and status
2. WHEN a user views the documents list THEN the System SHALL allow filtering by status (UNPAID, PARTIALLY_PAID, PAID)
3. WHEN a user views the documents list THEN the System SHALL allow filtering by document type
4. WHEN a user views the documents list THEN the System SHALL allow filtering by intervenant
5. WHEN a user views the documents list THEN the System SHALL display documents ordered by due date ascending by default

### Requirement 3

**User Story:** As a user, I want to link justifications to documents, so that I can track which payments apply to which documents.

#### Acceptance Criteria

1. WHEN a user creates a justification THEN the System SHALL allow selecting an optional document to link
2. WHEN a user links a justification to a document THEN the System SHALL verify that the justification amount does not exceed the document's remaining amount
3. WHEN a user links a justification to a document with insufficient remaining amount THEN the System SHALL reject the operation and display an error message
4. WHEN a user links a justification to a document THEN the System SHALL update the document's paid amount by adding the justification amount
5. WHEN a user links a justification to a document THEN the System SHALL recalculate the document's remaining amount as total minus paid

### Requirement 4

**User Story:** As a user, I want the system to automatically update document status based on payments, so that I can see at a glance which documents are fully paid.

#### Acceptance Criteria

1. WHEN a document's paid amount equals zero THEN the System SHALL set the status to UNPAID
2. WHEN a document's paid amount is greater than zero and less than the total amount THEN the System SHALL set the status to PARTIALLY_PAID
3. WHEN a document's paid amount equals the total amount THEN the System SHALL set the status to PAID
4. WHEN a justification linked to a document is deleted THEN the System SHALL recalculate the document's paid amount, remaining amount, and status
5. WHEN a justification linked to a document is modified THEN the System SHALL recalculate the document's paid amount, remaining amount, and status

### Requirement 5

**User Story:** As a user, I want to view document details with payment history, so that I can see all payments made against a specific document.

#### Acceptance Criteria

1. WHEN a user views a document's details THEN the System SHALL display the document information including type, reference, total amount, paid amount, remaining amount, and status
2. WHEN a user views a document's details THEN the System SHALL display all linked justifications with date, amount, category, and reference
3. WHEN a user views a document's details THEN the System SHALL display the payment progress as a percentage
4. WHEN a user views a document's details THEN the System SHALL display the intervenant information
5. WHEN a user views a document's details THEN the System SHALL allow navigating to linked justifications and disbursements

### Requirement 6

**User Story:** As a user, I want to create documents for different types (invoices, payslips, purchase orders), so that I can track various financial obligations.

#### Acceptance Criteria

1. WHEN a user creates a document THEN the System SHALL allow selecting from predefined types: INVOICE, PAYSLIP, PURCHASE_ORDER, CONTRACT, OTHER
2. WHEN a user creates a document of type PAYSLIP THEN the System SHALL suggest linking to a COLLABORATEUR intervenant
3. WHEN a user creates a document of type INVOICE THEN the System SHALL suggest linking to a FOURNISSEUR intervenant
4. WHEN a user views documents THEN the System SHALL display an icon or badge indicating the document type
5. WHEN a user filters documents by type THEN the System SHALL return only documents matching the selected type

### Requirement 7

**User Story:** As a user, I want to see warnings when creating justifications that would exceed a document's remaining amount, so that I can avoid over-payments.

#### Acceptance Criteria

1. WHEN a user creates a justification linked to a document THEN the System SHALL display the document's remaining amount
2. WHEN a user enters a justification amount greater than the document's remaining amount THEN the System SHALL display a warning message
3. WHEN a user attempts to save a justification exceeding the document's remaining amount THEN the System SHALL prevent the save and display an error
4. WHEN a user creates a justification for the exact remaining amount THEN the System SHALL allow the save and mark the document as PAID
5. WHEN a user views a document with zero remaining amount THEN the System SHALL disable the option to add new justifications

### Requirement 8

**User Story:** As a user, I want to edit and delete documents, so that I can correct errors or remove obsolete documents.

#### Acceptance Criteria

1. WHEN a user edits a document with no linked justifications THEN the System SHALL allow modifying all fields including the total amount
2. WHEN a user edits a document with linked justifications THEN the System SHALL prevent modifying the total amount if it would be less than the paid amount
3. WHEN a user deletes a document with no linked justifications THEN the System SHALL remove the document from the system
4. WHEN a user attempts to delete a document with linked justifications THEN the System SHALL prevent deletion and display an error message
5. WHEN a user edits a document THEN the System SHALL recalculate the remaining amount and status

### Requirement 9

**User Story:** As a user, I want to see document statistics on the dashboard, so that I can quickly understand my payment obligations.

#### Acceptance Criteria

1. WHEN a user views the dashboard THEN the System SHALL display the total number of unpaid documents
2. WHEN a user views the dashboard THEN the System SHALL display the total amount of unpaid documents
3. WHEN a user views the dashboard THEN the System SHALL display the number of overdue documents (past due date and not fully paid)
4. WHEN a user views the dashboard THEN the System SHALL display upcoming documents due within 7 days
5. WHEN a user views the dashboard THEN the System SHALL allow clicking on statistics to navigate to filtered document lists

### Requirement 10

**User Story:** As a user, I want to search documents by reference or intervenant name, so that I can quickly find specific documents.

#### Acceptance Criteria

1. WHEN a user enters a search term THEN the System SHALL search in document references, intervenant names, and notes
2. WHEN a user searches for a document THEN the System SHALL display matching results with highlighted search terms
3. WHEN a user searches with an empty term THEN the System SHALL display all documents
4. WHEN a user combines search with filters THEN the System SHALL apply both search and filter criteria
5. WHEN no documents match the search THEN the System SHALL display a message indicating no results found

### Requirement 11

**User Story:** As a system administrator, I want documents to be tenant-isolated, so that each organization only sees their own documents.

#### Acceptance Criteria

1. WHEN a user creates a document THEN the System SHALL associate it with the user's tenant
2. WHEN a user views documents THEN the System SHALL display only documents belonging to their tenant
3. WHEN a user links a justification to a document THEN the System SHALL verify both belong to the same tenant
4. WHEN a user attempts to access a document from another tenant THEN the System SHALL return a not found error
5. WHEN a user deletes their tenant THEN the System SHALL cascade delete all associated documents

### Requirement 12

**User Story:** As a user, I want to attach files to documents, so that I can store the original invoice or payslip PDF.

#### Acceptance Criteria

1. WHEN a user creates or edits a document THEN the System SHALL allow uploading file attachments
2. WHEN a user uploads a file THEN the System SHALL validate the file type (PDF, JPG, PNG) and size (max 10MB)
3. WHEN a user uploads an invalid file THEN the System SHALL reject the upload and display an error message
4. WHEN a user views a document THEN the System SHALL display all attached files with download links
5. WHEN a user deletes a document THEN the System SHALL delete all associated file attachments
