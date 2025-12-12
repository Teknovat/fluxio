# Implementation Plan - Disbursement Refactor & Cash Dashboard

## Overview

This implementation plan covers the refactoring of the Advance module into a Disbursement module and the creation of a new Cash Dashboard. The work is organized into phases to minimize disruption and allow for incremental testing.

## Current Status Summary

**Completed Phases (1-7):**

- ✅ Phase 1: Database Schema and Migration - All database models updated
- ✅ Phase 2: TypeScript Types and Enums - All types and interfaces created
- ✅ Phase 3: Calculation Utilities - Disbursement and cash calculations implemented with tests
- ✅ Phase 4: Backend API - Disbursement Endpoints - All CRUD endpoints complete
- ✅ Phase 5: Backend API - Cash Dashboard Endpoints - All cash endpoints complete
- ✅ Phase 6: Frontend - Disbursement Components - All forms and cards created
- ✅ Phase 7: Frontend - Disbursement Pages - List and detail pages complete

**Remaining Work:**

- Phase 8: Cash Dashboard UI (components and page)
- Phase 9: Navigation updates (add Dashboard link, update routing)
- Phase 10: Intervenant page integration (update to use disbursements)
- Phase 11: Alert system updates (terminology and new alert types)
- Phase 12: Reporting and export features
- Phase 13: Testing (optional)
- Phase 14: Documentation

**Key Notes:**

- The backend API is fully functional and tested
- Disbursement pages exist at /disbursements but navigation still points to /avances
- Cash Dashboard API is ready but UI components need to be built
- Alert system uses old terminology (OVERDUE_ADVANCE) and needs updating

## Phase 1: Database Schema and Migration

- [x] 1. Update Prisma schema

  - [x] 1.1 Create Justification model

    - Add all fields: id, tenantId, disbursementId, date, amount, category, reference, note, attachments, createdBy, createdAt, updatedAt
    - Add indexes: tenantId, disbursementId, date
    - Add relation to Disbursement
    - _Requirements: 2.1, 2.2, 2.3, 2.4_

  - [x] 1.2 Rename Advance model to Disbursement

    - Update model name in schema
    - Add initialAmount field
    - Add remainingAmount field
    - Add category field (DisbursementCategory enum)
    - Rename status values (EN_COURS → OPEN, REMBOURSE_PARTIEL → PARTIALLY_JUSTIFIED, REMBOURSE_TOTAL → JUSTIFIED)
    - Update relations: reimbursements → returns (for cash returns only)
    - Add justifications relation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 9.1, 9.2_

  - [x] 1.3 Update Mouvement model

    - Rename isAdvance to isDisbursement
    - Rename advanceId to disbursementId
    - Update relation names: advance → disbursement, linkedAdvance → linkedDisbursement
    - _Requirements: 1.1, 3.1, 9.5_

  - [x] 1.4 Update Intervenant model

    - Rename advances relation to disbursements
    - _Requirements: 8.1, 9.5_

## Phase 2: TypeScript Types and Enums

- [x] 2. Update TypeScript types

  - [x] 2.1 Create new enums in types/index.ts

    - Add DisbursementStatus enum (OPEN, PARTIALLY_JUSTIFIED, JUSTIFIED)
    - Add DisbursementCategory enum (STOCK_PURCHASE, BANK_DEPOSIT, SALARY_ADVANCE, GENERAL_EXPENSE, OTHER)
    - Add JustificationCategory enum
    - Remove or deprecate AdvanceStatus enum
    - _Requirements: 1.6, 2.8, 9.2_

  - [x] 2.2 Create Disbursement interface

    - Add all fields matching Prisma model
    - Include relations: intervenant, mouvement, justifications, returns
    - _Requirements: 1.2, 1.3, 1.4_

  - [x] 2.3 Create Justification interface

    - Add all fields matching Prisma model
    - Include relation to disbursement
    - _Requirements: 2.2, 2.3, 2.4_

  - [x] 2.4 Create CashDashboardData interface

    - Add currentBalance, todayInflows, todayOutflows, netChangeToday
    - Add recentMovements array
    - Add balanceTrend array
    - Add outstandingDisbursements
    - Add alerts array
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.8_

  - [x] 2.5 Update existing interfaces
    - Update Mouvement interface (isDisbursement, disbursementId)
    - Update Intervenant interface (disbursements relation)
    - Deprecate Advance interface with comments
    - _Requirements: 9.5_

## Phase 3: Calculation Utilities

- [x] 3. Create disbursement calculation utilities

  - [x] 3.1 Create lib/disbursement-calculations.ts

    - Implement calculateDisbursementRemaining function
    - Implement determineDisbursementStatus function
    - Implement isDisbursementOverdue function
    - Implement getDaysOutstanding function
    - _Requirements: 1.3, 1.4, 2.6, 2.7, 4.2, 5.5, 5.6, 5.7_

  - [x] 3.2 Write unit tests for disbursement calculations
    - Test calculateDisbursementRemaining with justifications only
    - Test calculateDisbursementRemaining with returns only
    - Test calculateDisbursementRemaining with both
    - Test determineDisbursementStatus for all status values
    - Test isDisbursementOverdue logic
    - Test getDaysOutstanding calculation
    - _Requirements: 1.3, 1.4, 2.6, 2.7_

- [x] 5. Create cash calculation utilities

  - [x] 5.1 Create lib/cash-calculations.ts

    - Implement calculateCurrentCashBalance function
    - Implement calculateCashBalanceTrend function
    - Implement getTodayCashSummary function
    - Implement getRecentCashMovements function
    - _Requirements: 6.2, 6.3, 6.4, 6.8_

  - [x] 5.2 Write unit tests for cash calculations
    - Test calculateCurrentCashBalance with mixed movements
    - Test calculateCashBalanceTrend over 30 days
    - Test getTodayCashSummary with today's movements
    - Test filtering by modality (ESPECES only)
    - _Requirements: 6.2, 6.3, 6.4_

## Phase 4: Backend API - Disbursement Endpoints

- [x] 6. Implement disbursement API endpoints

  - [x] 6.1 Create GET /api/disbursements endpoint

    - Accept query params: status, intervenantId, dateFrom, dateTo, category
    - Filter by tenantId (CRITICAL)
    - Include: intervenant, mouvement, justifications, returns
    - Calculate remaining for each disbursement
    - Sort by date descending
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 11.5, 11.7_

  - [x] 6.2 Create POST /api/disbursements endpoint

    - Validate request body (date, intervenantId, amount, category, dueDate, note)
    - Verify intervenant exists and is active
    - Verify intervenant belongs to tenant
    - Create Disbursement record
    - Create SORTIE Mouvement
    - Set status to OPEN
    - Set remainingAmount = initialAmount
    - Return created disbursement with relations
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 11.1, 11.5_

  - [x] 6.3 Create GET /api/disbursements/[id] endpoint

    - Verify disbursement belongs to tenant
    - Include all relations: intervenant, mouvement, justifications, returns
    - Calculate totals: totalJustified, totalReturned, remaining
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 11.5, 11.7_

  - [x] 6.4 Create GET /api/disbursements/summary endpoint
    - Calculate totalDisbursed (sum of all initialAmounts)
    - Calculate totalJustified (sum of all justifications + returns)
    - Calculate totalOutstanding (sum of all remainingAmounts)
    - Group by category
    - Filter by tenantId
    - _Requirements: 4.9, 10.1, 10.2_

- [x] 7. Implement justification API endpoints

  - [x] 7.1 Create POST /api/disbursements/[id]/justify endpoint

    - Validate request body (date, amount, category, reference, note)
    - Verify disbursement exists and belongs to tenant
    - Validate amount <= remainingAmount
    - Create Justification record (NO movement)
    - Update disbursement remainingAmount
    - Update disbursement status if needed
    - Return updated disbursement and justification
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7, 2.10, 11.2, 11.5_

  - [x] 7.2 Create GET /api/disbursements/[id]/justifications endpoint
    - Verify disbursement belongs to tenant
    - Return all justifications for the disbursement
    - Sort by date ascending
    - _Requirements: 2.10, 5.3, 11.5_

- [x] 8. Implement return to cash API endpoints

  - [x] 8.1 Create POST /api/disbursements/[id]/return endpoint
    - Validate request body (date, amount, reference, note)
    - Verify disbursement exists and belongs to tenant
    - Validate amount <= remainingAmount
    - Create ENTREE Mouvement linked to disbursement
    - Update disbursement remainingAmount
    - Update disbursement status if needed
    - Return updated disbursement and movement
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 11.3, 11.5_

## Phase 5: Backend API - Cash Dashboard Endpoints

- [x] 9. Implement cash dashboard API endpoints

  - [x] 9.1 Create GET /api/cash/dashboard endpoint

    - Calculate current cash balance
    - Calculate today's inflows, outflows, net change
    - Fetch recent movements (last 20)
    - Calculate balance trend (last 30 days)
    - Calculate outstanding disbursements
    - Fetch active alerts
    - Return CashDashboardData
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9_

  - [x] 9.2 Create GET /api/cash/balance endpoint

    - Calculate current cash balance from ESPECES movements
    - Return balance and lastUpdated timestamp
    - Implement caching (5-minute TTL)
    - _Requirements: 6.2_

  - [x] 9.3 Create POST /api/cash/inflow endpoint
    - Validate request body (date, amount, category, intervenantId, reference, note)
    - Create ENTREE Mouvement with modality ESPECES
    - Update cash balance cache
    - Return created movement
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8_

## Phase 6: Frontend - Disbursement Components

- [x] 10. Create disbursement components

  - [x] 10.1 Create DisbursementCard component

    - Display: intervenant, date, initialAmount, remaining, status
    - Show progress bar (justified percentage)
    - Display days outstanding
    - Highlight if overdue (red border/background)
    - Add action buttons: Justify, Return to Cash
    - _Requirements: 4.2, 4.7, 4.8, 5.7, 5.8_

  - [x] 10.2 Create DisbursementForm component

    - Modal form for creating disbursement
    - Fields: date, intervenant, amount, category, dueDate, note
    - Validation: amount > 0, intervenant required
    - Submit to POST /api/disbursements
    - Show success/error messages
    - _Requirements: 1.5, 1.6, 1.7, 1.8, 1.10, 7.4_

  - [x] 10.3 Create JustificationForm component

    - Modal form for adding justification
    - Display disbursement details (intervenant, amount, remaining)
    - Fields: date, amount, category, reference, note
    - Validation: amount <= remaining
    - Clear message: "This does NOT create a cash movement"
    - Submit to POST /api/disbursements/[id]/justify
    - _Requirements: 2.4, 2.5, 2.8, 5.9, 5.10_

  - [x] 10.4 Create ReturnToCashForm component
    - Modal form for recording return to cash
    - Display disbursement details
    - Fields: date, amount, reference, note
    - Validation: amount <= remaining
    - Clear message: "This WILL create a cash inflow"
    - "Return All" button to fill remaining amount
    - Submit to POST /api/disbursements/[id]/return
    - _Requirements: 3.4, 3.6, 3.7, 5.10_

## Phase 7: Frontend - Disbursement Pages

- [x] 11. Create disbursements list page

  - [x] 11.1 Create app/(dashboard)/disbursements/page.tsx

    - Rename from /avances route
    - Display summary cards: total, justified, outstanding
    - Display disbursements table with columns: intervenant, date, amount, remaining, status, days, actions
    - Implement status filter dropdown
    - Implement intervenant filter dropdown
    - Implement date range filters (from/to)
    - Implement category filter dropdown
    - Add "Create Disbursement" button
    - Highlight overdue disbursements in red
    - Add "Justify" and "Return" buttons per row
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 4.10_

  - [x] 11.2 Integrate DisbursementForm modal

    - Open modal on "Create Disbursement" button click
    - Refresh list on successful creation
    - Show toast notifications
    - _Requirements: 1.5, 7.4_

  - [x] 11.3 Integrate JustificationForm modal

    - Open modal on "Justify" button click
    - Pass selected disbursement to modal
    - Refresh list on successful justification
    - _Requirements: 2.4, 5.9_

  - [x] 11.4 Integrate ReturnToCashForm modal
    - Open modal on "Return" button click
    - Pass selected disbursement to modal
    - Refresh list on successful return
    - _Requirements: 3.7, 5.10_

- [x] 12. Create disbursement detail page

  - [x] 12.1 Create app/(dashboard)/disbursements/[id]/page.tsx

    - Display disbursement summary card
    - Display progress bar showing justified percentage
    - Display justifications history section
    - Display returns to cash history section
    - Calculate and display: total justified, total returned, remaining
    - Display days outstanding and days overdue
    - Add "Add Justification" button
    - Add "Add Return" button
    - Add "Back to List" button
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10_

  - [x] 12.2 Integrate justification and return forms
    - Open JustificationForm modal on button click
    - Open ReturnToCashForm modal on button click
    - Refresh detail view on successful submission
    - _Requirements: 5.9, 5.10_

## Phase 8: Frontend - Cash Dashboard

- [x] 13. Create cash dashboard components

  - [x] 13.1 Create CashBalanceCard component

    - Large, prominent display of current balance
    - Color coding: green if positive, red if negative, yellow if near zero
    - Display last updated timestamp
    - Add refresh button
    - _Requirements: 6.1, 6.2_

  - [x] 13.2 Create QuickActionButtons component

    - Button: Add Cash Inflow
    - Button: Create Disbursement
    - Button: View All Movements
    - Icon-based design for quick recognition
    - _Requirements: 7.1, 7.4_

  - [x] 13.3 Create CashInflowForm component

    - Modal form for adding cash inflow
    - Fields: date, amount, category, intervenant (optional), reference, note
    - Validation: amount > 0, category required
    - Default date to today
    - Submit to POST /api/cash/inflow
    - _Requirements: 7.1, 7.2, 7.3, 7.5, 7.6, 7.7, 7.8, 7.9_

  - [x] 13.4 Create CashBalanceTrendChart component

    - Line chart showing balance over last 30 days
    - Use recharts library (install if needed: npm install recharts)
    - Responsive design
    - Tooltip showing date and balance
    - _Requirements: 6.8_

  - [x] 13.5 Create RecentMovementsTable component
    - Table showing last 20 movements
    - Columns: date, type, amount, category, intervenant, note
    - Color code by type: green for inflow, red for outflow
    - Click row to view movement details
    - _Requirements: 6.4_

- [x] 14. Create cash dashboard page

  - [x] 14.1 Create app/(dashboard)/dashboard/page.tsx

    - Display CashBalanceCard at top
    - Display summary cards: today's inflows, outflows, net change
    - Display QuickActionButtons
    - Display RecentMovementsTable
    - Display CashBalanceTrendChart
    - Display outstanding disbursements summary
    - Display active alerts section
    - Implement auto-refresh every 5 minutes
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7, 6.8, 6.9, 6.10_

  - [x] 14.2 Implement filters for recent movements

    - Date range filter
    - Type filter (inflow/outflow)
    - Category filter
    - Apply filters without page reload
    - _Requirements: 6.5, 6.6, 6.7_

  - [x] 14.3 Integrate CashInflowForm modal

    - Open on "Add Cash Inflow" button click
    - Refresh dashboard on successful submission
    - _Requirements: 7.1, 7.6_

  - [x] 14.4 Integrate DisbursementForm modal
    - Open on "Create Disbursement" button click
    - Refresh dashboard on successful creation
    - _Requirements: 7.4_

## Phase 9: Navigation and Routing Updates

- [x] 15. Update navigation and routing

  - [x] 15.1 Update navigation menu in layout

    - Add "Dashboard" menu item (home icon) at the beginning
    - Add "Décaissements" menu item (banknote icon) after Mouvements
    - Update href to /disbursements
    - Keep existing "Avances" link temporarily for backward compatibility
    - Reorder: Dashboard first, then Mouvements, Décaissements, Soldes, etc.
    - _Requirements: 6.10_

  - [x] 15.2 Update default route

    - Update middleware to redirect authenticated users from / to /dashboard
    - Update middleware to redirect from /login to /dashboard (instead of /mouvements)
    - _Requirements: 6.10_

  - [x] 15.3 Create route redirects for backward compatibility

    - Create middleware redirect from /avances to /disbursements
    - Create middleware redirect from /avances/[id] to /disbursements/[id]
    - Add console warning for deprecated routes
    - _Requirements: 9.7_

  - [x] 15.4 Update all internal links
    - Update links in intervenant detail page (currently uses /avances)
    - Update links in movement forms if any
    - Update links in alert system
    - Search codebase for /avances and update to /disbursements
    - _Requirements: 9.7_

## Phase 10: Intervenant Integration

- [x] 16. Update intervenant detail page

  - [x] 16.1 Update app/(dashboard)/intervenants/[id]/page.tsx

    - Rename "Avances et Remboursements" section to "Décaissements"
    - Update API calls from /api/advances to /api/disbursements (currently fetches from /api/balances/[id])
    - Update data structure to use Disbursement type instead of Advance
    - Display disbursements with new status labels (OPEN, PARTIALLY_JUSTIFIED, JUSTIFIED)
    - Update expandable sections to show both justifications and returns separately
    - Display "Justifications" section (non-cash documentation)
    - Display "Returns to Cash" section (actual cash returns)
    - Calculate and display totals: total disbursed, total justified, total returned, outstanding
    - Update progress bar to show justified + returned percentage
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9, 8.10_

  - [x] 16.2 Add create disbursement button

    - Add "Create Disbursement" button in the intervenant detail page header
    - Import and integrate DisbursementForm component
    - Pre-fill intervenant field in DisbursementForm
    - Refresh intervenant data after successful disbursement creation
    - _Requirements: 8.5_

  - [x] 16.3 Add justify and return actions
    - Add "Justify" and "Return to Cash" action buttons for each disbursement
    - Import and integrate JustificationForm component
    - Import and integrate ReturnToCashForm component
    - Open appropriate modals with pre-filled disbursement data
    - Refresh intervenant data after successful submission
    - _Requirements: 8.6_

## Phase 11: Alerts and Notifications

- [x] 17. Update alert system for disbursements

  - [x] 17.1 Update lib/alerts.ts

    - Updated alert type enum from OVERDUE_ADVANCE to OVERDUE_DISBURSEMENT in types/index.ts
    - Updated checkOverdueDisbursements function to use new alert type
    - Alert messages already use "décaissement" terminology
    - Added checkLongOpenDisbursements function for disbursements open > 30 days (new alert type: LONG_OPEN_DISBURSEMENT)
    - Added checkHighOutstandingDisbursements function for total outstanding exceeding threshold (new alert type: HIGH_OUTSTANDING_DISBURSEMENTS)
    - Updated tests in lib/alerts.test.ts to use new alert types
    - Updated Prisma schema comment to reflect new alert types
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.9_

  - [x] 17.2 Update alert display components

    - Created AlertBanner component with severity-based styling
    - Updated alert navigation links to point to /disbursements instead of /avances
    - Displayed disbursement alerts on Cash Dashboard with dismiss functionality
    - Added alert count badge in navigation bar with auto-refresh every 5 minutes
    - Created API endpoints: GET /api/alerts, POST /api/alerts/[id]/dismiss, POST /api/alerts/check
    - _Requirements: 12.4, 12.8_

  - [x] 17.3 Add alert configuration in settings
    - Added disbursementOutstandingThreshold setting to Settings model (default: 10000)
    - Added disbursementOpenDaysWarning setting to Settings model (default: 30 days)
    - Created settings API endpoints: GET /api/settings, PUT /api/settings
    - Created settings page at /settings with all alert configuration options
    - Added Settings link to navigation menu (admin only)
    - Updated alert functions to use configurable thresholds from settings
    - Created migration script for new settings fields
    - _Requirements: 12.5_

## Phase 12: Reporting and Export

- [ ] 18. Implement disbursement reports

  - [ ] 18.1 Create app/api/reports/disbursements/summary/route.ts

    - Calculate total disbursed by category
    - Calculate total disbursed by status
    - Calculate total disbursed by intervenant
    - Support date range filtering via query params
    - Return summary statistics
    - _Requirements: 10.1_

  - [ ] 18.2 Create app/api/reports/disbursements/aging/route.ts

    - Group outstanding disbursements by age: 0-7 days, 8-30 days, 31-60 days, 60+ days
    - Calculate totals for each age group
    - Identify top 10 intervenants by outstanding amount
    - Return aging analysis data
    - _Requirements: 10.2, 10.4_

  - [ ] 18.3 Create app/api/reports/disbursements/export/route.ts

    - Install xlsx library if needed: npm install xlsx
    - Export disbursements to Excel format
    - Include columns: date, intervenant, category, initial amount, justified, returned, remaining, status, days outstanding
    - Support filtering by status, intervenant, date range via query params
    - Return Excel file as blob
    - _Requirements: 10.6_

  - [ ] 18.4 Create app/api/reports/cash/export/route.ts

    - Install pdf generation library if needed (e.g., pdfkit or jspdf)
    - Export cash dashboard data to PDF
    - Include current balance, today's summary, recent movements
    - Include balance trend chart as image
    - Return PDF file as blob
    - _Requirements: 10.7_

  - [ ] 18.5 Add export buttons to pages
    - Add "Export to Excel" button to disbursements list page (app/(dashboard)/disbursements/page.tsx)
    - Add "Export to PDF" button to cash dashboard (when created)
    - Add "Export Details" button to disbursement detail page
    - Handle file download in browser
    - Show loading state during export
    - _Requirements: 10.6, 10.7_

## Phase 13: Testing (Optional - can be done incrementally)

- [ ]\* 19. Write integration tests

  - [ ]\* 19.1 Test disbursement creation

    - Test POST /api/disbursements creates both disbursement and movement
    - Test validation errors (amount > 0, intervenant exists, etc.)
    - Test tenant isolation (cannot create for other tenant)
    - Create test file: app/api/disbursements/route.test.ts
    - _Requirements: 1.1, 1.2, 11.5_

  - [ ]\* 19.2 Test justification flow

    - Test POST /api/disbursements/[id]/justify does NOT create movement
    - Test remainingAmount calculation after justification
    - Test status updates (OPEN → PARTIALLY_JUSTIFIED → JUSTIFIED)
    - Test validation (amount <= remaining, amount > 0)
    - Create test file: app/api/disbursements/[id]/justify/route.test.ts
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 2.7_

  - [ ]\* 19.3 Test return to cash flow

    - Test POST /api/disbursements/[id]/return creates ENTREE movement
    - Test remainingAmount calculation after return
    - Test status updates
    - Test cash balance update
    - Create test file: app/api/disbursements/[id]/return/route.test.ts
    - _Requirements: 3.1, 3.2, 3.5, 3.8_

  - [ ]\* 19.4 Test cash dashboard calculations

    - Test GET /api/cash/dashboard returns correct balance
    - Test balance calculation with mixed movements (ENTREE/SORTIE)
    - Test today's summary calculation
    - Test balance trend calculation over 30 days
    - Create test file: app/api/cash/dashboard/route.test.ts
    - _Requirements: 6.2, 6.3, 6.8_

  - [ ]\* 19.5 Test cash inflow creation
    - Test POST /api/cash/inflow creates movement
    - Test cash balance update
    - Test validation (amount > 0, category required)
    - Create test file: app/api/cash/inflow/route.test.ts
    - _Requirements: 7.2, 7.3, 7.5_

- [ ]\* 20. Write end-to-end tests (Optional - requires E2E testing setup)

  - [ ]\* 20.1 Test complete disbursement lifecycle

    - Create disbursement via UI
    - Add justification via UI
    - Add return to cash via UI
    - Verify status changes in UI
    - Verify cash balance updates in UI
    - Use Playwright or Cypress
    - _Requirements: 1.1, 2.1, 3.1_

  - [ ]\* 20.2 Test cash dashboard workflow

    - Navigate to dashboard
    - Verify balance display
    - Add cash inflow via quick action
    - Create disbursement via quick action
    - Verify updates
    - _Requirements: 6.1, 7.1, 7.4_

  - [ ]\* 20.3 Test intervenant integration
    - Navigate to intervenant detail
    - View disbursements section
    - Create disbursement for intervenant
    - Add justification
    - Verify balance calculation
    - _Requirements: 8.1, 8.5, 8.6, 8.8_

## Phase 14: Documentation and Deployment

- [ ] 21. Update documentation

  - [ ] 21.1 Update README.md

    - Add section documenting Disbursement module
    - Add section documenting Cash Dashboard features
    - Update API endpoint list with new disbursement and cash endpoints
    - Add migration guide from Advance to Disbursement
    - Document key differences: Justification vs Return to Cash
    - _Requirements: 9.10_

  - [ ] 21.2 Create user guide document

    - Create docs/USER_GUIDE.md
    - Document difference between justification (no cash movement) and return (cash movement)
    - Provide examples of each disbursement category (STOCK_PURCHASE, BANK_DEPOSIT, etc.)
    - Explain cash dashboard features and metrics
    - Include workflow examples
    - Add troubleshooting section
    - _Requirements: 9.10_

  - [ ] 21.3 Create API documentation

    - Create docs/API.md
    - Document all disbursement endpoints with request/response examples
    - Document all cash endpoints with request/response examples
    - Document error codes and their meanings
    - Provide curl examples for each endpoint
    - _Requirements: 9.7_

  - [ ] 21.4 Update CHANGELOG
    - Create CHANGELOG.md if it doesn't exist
    - List all breaking changes (Advance → Disbursement, API endpoint changes)
    - List new features (Cash Dashboard, Justifications, Returns)
    - List deprecated features (/avances routes)
    - Provide step-by-step migration instructions
    - _Requirements: 9.10_

- [ ]\* 22. Deployment preparation (Optional - for production deployment)

  - [ ]\* 22.1 Create deployment checklist

    - Create docs/DEPLOYMENT.md
    - Document database backup procedure
    - Document migration testing on staging
    - Create rollback plan
    - Schedule maintenance window
    - _Requirements: 9.8, 9.9_

  - [ ]\* 22.2 Run migration on staging

    - Execute Prisma migration: npx prisma migrate deploy
    - Run data migration script if needed
    - Verify data integrity with queries
    - Test critical paths (create disbursement, justify, return)
    - _Requirements: 9.1, 9.4, 9.8_

  - [ ]\* 22.3 Deploy to production

    - Execute database migration
    - Deploy backend changes
    - Deploy frontend changes
    - Verify deployment
    - Monitor logs for errors
    - _Requirements: 9.8_

  - [ ]\* 22.4 Post-deployment verification

    - Test disbursement creation in production
    - Test justification flow
    - Test return to cash flow
    - Test cash dashboard
    - Verify alerts are working
    - Check performance metrics
    - _Requirements: 9.8_

  - [ ]\* 22.5 Communicate changes to users
    - Send email announcement about new features
    - Provide training materials or video
    - Offer support channel for questions
    - Gather user feedback
    - _Requirements: 9.10_

## Notes

- **Critical Path:** Phases 1-4 must be completed before any frontend work
- **Testing:** Each phase should include testing before moving to the next
- **Rollback:** Keep the rollback script ready throughout deployment
- **Communication:** Inform users about terminology changes (Advance → Disbursement)
- **Performance:** Monitor database query performance after migration
- **Backward Compatibility:** Maintain redirects for old URLs for at least 3 months
