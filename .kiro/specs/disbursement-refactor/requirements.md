# Requirements Document - Disbursement Module & Cash Dashboard

## Introduction

This document outlines the requirements for refactoring the existing Advance module into a more generic Disbursement module and creating a new Cash Dashboard. The Disbursement module will handle real cash outflows that require later justification (stock purchases, bank deposits, salary advances, miscellaneous expenses), while the Cash Dashboard will provide real-time visibility into cash position and enable quick cash operations.

## Glossary

- **Disbursement**: A real cash outflow that requires later justification or return. Replaces the concept of "Advance"
- **Justification**: Documentation or proof that explains how a disbursement was used. Does NOT create cash movements, only reduces the remaining amount. Replaces "Reimbursement"
- **Return to Cash**: Physical return of unused disbursement funds, creating a real cash inflow movement
- **Cash Balance**: The actual amount of physical cash available, calculated from real inflow/outflow movements only
- **Intervenant**: A person or entity involved in transactions (employee, supplier, associate, etc.)
- **Movement**: A cash transaction record (inflow or outflow)
- **Tenant**: An organization using the system independently from other organizations

## Requirements

### Requirement 1: Disbursement Creation

**User Story:** As a manager, I want to create disbursements for various purposes (stock purchases, bank deposits, expenses), so that I can track cash given out that needs justification.

#### Acceptance Criteria

1. WHEN a user creates a disbursement, THE System SHALL create a Movement record with type SORTIE (outflow)
2. WHEN a user creates a disbursement, THE System SHALL create a Disbursement record containing initialAmount, remainingAmount, status, intervenantId, and relatedMovementId
3. THE System SHALL set the initial status to OPEN when creating a new disbursement
4. THE System SHALL set remainingAmount equal to initialAmount when creating a new disbursement
5. WHEN creating a disbursement, THE System SHALL require: date, intervenant, amount, and optional dueDate and note
6. THE System SHALL support disbursement categories: STOCK_PURCHASE, BANK_DEPOSIT, SALARY_ADVANCE, GENERAL_EXPENSE, OTHER
7. THE System SHALL validate that the amount is greater than zero
8. THE System SHALL validate that the intervenant exists and is active
9. THE System SHALL record the creation timestamp and user who created the disbursement
10. THE System SHALL allow setting an optional due date for when justification is expected

### Requirement 2: Disbursement Justification

**User Story:** As a manager, I want to record justifications for disbursements without creating cash movements, so that I can track how disbursed funds were used.

#### Acceptance Criteria

1. WHEN a user adds a justification, THE System SHALL NOT create any Movement record
2. WHEN a user adds a justification, THE System SHALL create a Justification record linked to the disbursement
3. WHEN a user adds a justification, THE System SHALL reduce the disbursement remainingAmount by the justification amount
4. WHEN a user adds a justification, THE System SHALL require: date, amount, category, and optional reference and note
5. THE System SHALL validate that justification amount does not exceed remainingAmount
6. WHEN remainingAmount reaches zero, THE System SHALL update disbursement status to JUSTIFIED
7. WHEN remainingAmount is less than initialAmount but greater than zero, THE System SHALL update status to PARTIALLY_JUSTIFIED
8. THE System SHALL support justification categories matching the disbursement purpose
9. THE System SHALL allow attaching supporting documents or receipts to justifications (future enhancement)
10. THE System SHALL maintain a complete history of all justifications for each disbursement

### Requirement 3: Return to Cash

**User Story:** As a manager, I want to record when unused disbursement funds are returned to cash, so that I can accurately track cash inflows and disbursement status.

#### Acceptance Criteria

1. WHEN a user records a return to cash, THE System SHALL create a Movement record with type ENTREE (inflow)
2. WHEN a user records a return to cash, THE System SHALL reduce the disbursement remainingAmount by the return amount
3. WHEN a user records a return to cash, THE System SHALL link the Movement to the disbursement
4. THE System SHALL validate that return amount does not exceed remainingAmount
5. WHEN remainingAmount reaches zero after a return, THE System SHALL update disbursement status to JUSTIFIED
6. THE System SHALL allow partial returns to cash
7. THE System SHALL require: date, amount, and optional reference and note for returns
8. THE System SHALL update cash balance immediately when return is recorded
9. THE System SHALL allow combining justifications and returns for the same disbursement
10. THE System SHALL display return transactions in the movement history

### Requirement 4: Disbursement List and Filtering

**User Story:** As a manager, I want to view and filter all disbursements, so that I can monitor outstanding disbursements and their status.

#### Acceptance Criteria

1. WHEN a user accesses the Disbursements page, THE System SHALL display all disbursements for the tenant
2. THE System SHALL display: intervenant, date, amount, remaining, status, days outstanding, and due date
3. THE System SHALL allow filtering by status (OPEN, PARTIALLY_JUSTIFIED, JUSTIFIED)
4. THE System SHALL allow filtering by intervenant
5. THE System SHALL allow filtering by date range
6. THE System SHALL allow filtering by category
7. THE System SHALL highlight overdue disbursements (past due date with remaining > 0) in red
8. THE System SHALL sort disbursements by date descending by default
9. THE System SHALL display summary cards showing: total disbursed, total justified, total outstanding
10. THE System SHALL allow clicking on a disbursement to view details

### Requirement 5: Disbursement Detail View

**User Story:** As a manager, I want to see complete details of a disbursement including all justifications and returns, so that I can understand how funds were used.

#### Acceptance Criteria

1. WHEN a user views a disbursement detail, THE System SHALL display: intervenant, date, initial amount, remaining amount, status, due date
2. THE System SHALL display a progress bar showing justified percentage
3. THE System SHALL display a complete history of justifications with dates, amounts, categories, and notes
4. THE System SHALL display a complete history of returns to cash with dates, amounts, and references
5. THE System SHALL calculate and display total justified amount
6. THE System SHALL calculate and display total returned amount
7. THE System SHALL display days since disbursement was created
8. THE System SHALL display days overdue if past due date
9. THE System SHALL allow adding new justifications from the detail view
10. THE System SHALL allow adding returns to cash from the detail view

### Requirement 6: Cash Dashboard Overview

**User Story:** As a manager, I want a dashboard showing current cash position and recent activity, so that I can quickly understand the cash situation.

#### Acceptance Criteria

1. WHEN a user accesses the Cash Dashboard, THE System SHALL display the current cash balance prominently
2. THE System SHALL calculate cash balance from all ENTREE and SORTIE movements with modality ESPECES
3. THE System SHALL display summary cards for: current balance, today's inflows, today's outflows, net change today
4. THE System SHALL display a list of recent movements (last 20) with date, type, amount, category, intervenant, note
5. THE System SHALL allow filtering recent movements by date range
6. THE System SHALL allow filtering recent movements by type (inflow/outflow)
7. THE System SHALL allow filtering recent movements by category
8. THE System SHALL display a chart showing cash balance trend over the last 30 days
9. THE System SHALL refresh data automatically or provide a manual refresh button
10. THE System SHALL make the Cash Dashboard the default home page after login

### Requirement 7: Quick Cash Actions

**User Story:** As a manager, I want to quickly add cash movements and create disbursements from the dashboard, so that I can perform common operations efficiently.

#### Acceptance Criteria

1. WHEN a user clicks "Add Cash Inflow" on the dashboard, THE System SHALL open a modal form
2. THE "Add Cash Inflow" form SHALL require: date, amount, category, and optional intervenant, reference, note
3. WHEN a user submits the inflow form, THE System SHALL create a Movement with type ENTREE
4. WHEN a user clicks "Create Disbursement" on the dashboard, THE System SHALL open the disbursement creation modal
5. THE System SHALL validate all required fields before submission
6. THE System SHALL update the dashboard immediately after successful submission
7. THE System SHALL display success/error messages for all actions
8. THE System SHALL default the date to today for quick entry
9. THE System SHALL remember the last used category for faster entry
10. THE System SHALL allow keyboard shortcuts for common actions (future enhancement)

### Requirement 8: Intervenant Integration

**User Story:** As a manager, I want to see all disbursements for an intervenant on their detail page, so that I can understand their complete financial relationship.

#### Acceptance Criteria

1. WHEN a user views an intervenant detail page, THE System SHALL display a section for disbursements
2. THE System SHALL list all disbursements for that intervenant with status, amount, remaining, and date
3. THE System SHALL display total disbursed, total justified, and total outstanding for the intervenant
4. THE System SHALL allow expanding each disbursement to see justifications and returns
5. THE System SHALL allow creating new disbursements for the intervenant from their detail page
6. THE System SHALL allow adding justifications and returns from the intervenant detail page
7. THE System SHALL highlight overdue disbursements on the intervenant page
8. THE System SHALL calculate the intervenant's balance including disbursement impacts
9. THE System SHALL display disbursement history in chronological order
10. THE System SHALL allow filtering disbursements by status and date range

### Requirement 9: Data Migration and Backward Compatibility

**User Story:** As a system administrator, I want existing advance data to be migrated to the new disbursement structure, so that historical data is preserved.

#### Acceptance Criteria

1. THE System SHALL provide a migration script to convert Advance records to Disbursement records
2. THE System SHALL convert AdvanceStatus values to DisbursementStatus values (EN_COURS → OPEN, etc.)
3. THE System SHALL convert advance reimbursements to appropriate justifications or returns based on movement type
4. THE System SHALL preserve all historical data including dates, amounts, and relationships
5. THE System SHALL update all foreign key references from advanceId to disbursementId
6. THE System SHALL rename database tables: Advance → Disbursement
7. THE System SHALL update all API endpoints from /api/advances to /api/disbursements
8. THE System SHALL maintain data integrity during migration with transaction rollback on errors
9. THE System SHALL provide a rollback mechanism in case of migration issues
10. THE System SHALL log all migration activities for audit purposes

### Requirement 10: Reporting and Analytics

**User Story:** As a manager, I want to see reports on disbursement patterns and cash flow, so that I can make informed decisions.

#### Acceptance Criteria

1. THE System SHALL provide a disbursement summary report showing total by category
2. THE System SHALL provide a disbursement aging report showing outstanding amounts by time period
3. THE System SHALL calculate average time to justification for completed disbursements
4. THE System SHALL identify intervenants with highest outstanding disbursements
5. THE System SHALL provide cash flow analysis showing inflows vs outflows over time
6. THE System SHALL allow exporting disbursement data to Excel
7. THE System SHALL allow exporting cash dashboard data to PDF
8. THE System SHALL display trends comparing current period to previous period
9. THE System SHALL highlight anomalies or unusual patterns (future enhancement)
10. THE System SHALL allow scheduling automated reports (future enhancement)

### Requirement 11: Permissions and Security

**User Story:** As an administrator, I want to control who can create, justify, and manage disbursements, so that cash operations are properly authorized.

#### Acceptance Criteria

1. THE System SHALL require ADMIN role to create disbursements
2. THE System SHALL require ADMIN role to add justifications
3. THE System SHALL require ADMIN role to record returns to cash
4. THE System SHALL allow USER role to view disbursements (read-only)
5. THE System SHALL enforce tenant isolation for all disbursement operations
6. THE System SHALL log all disbursement creation, justification, and return actions
7. THE System SHALL validate tenant ownership before allowing any disbursement operations
8. THE System SHALL prevent users from accessing disbursements from other tenants
9. THE System SHALL require authentication for all disbursement API endpoints
10. THE System SHALL implement rate limiting on disbursement creation to prevent abuse

### Requirement 12: Notifications and Alerts

**User Story:** As a manager, I want to receive alerts for overdue disbursements and large outstanding amounts, so that I can take timely action.

#### Acceptance Criteria

1. WHEN a disbursement becomes overdue, THE System SHALL create an alert
2. WHEN total outstanding disbursements exceed a threshold, THE System SHALL create an alert
3. WHEN a disbursement remains open for more than 30 days, THE System SHALL create a warning alert
4. THE System SHALL display disbursement alerts on the Cash Dashboard
5. THE System SHALL allow configuring alert thresholds in settings
6. THE System SHALL allow dismissing alerts once addressed
7. THE System SHALL send email notifications for critical alerts (future enhancement)
8. THE System SHALL display alert count in the navigation bar
9. THE System SHALL allow filtering alerts by type and severity
10. THE System SHALL maintain alert history for audit purposes
