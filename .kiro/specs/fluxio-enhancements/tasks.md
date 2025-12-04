# Implementation Plan - Fluxio Enhancements

## Phase 1: Foundation and Database

- [x] 1. Update database schema and run migrations

  - Add MovementCategory, AdvanceStatus, AlertType enums to Prisma schema
  - Add category field to Mouvement model
  - Create Advance model with relations
  - Create CashReconciliation model
  - Create Alert model
  - Create Settings model
  - Add advances relation to Intervenant
  - Add reconciliations relation to User
  - Add notes field to Intervenant
  - Run `npx prisma migrate dev --name add-enhancements`
  - Generate Prisma client
  - _Requirements: 11, 12, 13, 14, 15, 19_

- [x] 2. Update TypeScript types

  - Add MovementCategory enum to types/index.ts
  - Add AdvanceStatus enum
  - Add AlertType enum
  - Add Advance interface
  - Add CashReconciliation interface
  - Add Alert interface
  - Add Settings interface
  - Add IntervenantBalance interface
  - Add BalanceSummary interface
  - Add CategorySummary interface
  - Add DashboardData interface
  - Update Mouvement interface to include category
  - _Requirements: 11, 12, 13, 14, 15, 19_

- [x] 3. Create calculation utilities

  - Create lib/calculations.ts
  - Implement calculateIntervenantBalance function
  - Implement calculateTheoreticalCashBalance function
  - Implement calculateAdvanceRemaining function
  - Implement determineAdvanceStatus function
  - Implement calculateAllBalances function
  - _Requirements: 11, 12, 14_

- [x] 4. Create alert utilities
  - Create lib/alerts.ts
  - Implement checkAndCreateAlerts function
  - Implement checkDebtThresholds logic
  - Implement checkLowCash logic
  - Implement checkOverdueAdvances logic
  - Implement checkReconciliationGap logic
  - _Requirements: 15_

## Phase 2: Balance Management (Priority 1)

- [x] 5. Implement balance API endpoints

  - [x] 5.1 Create GET /api/balances endpoint

    - Calculate balances for all intervenants
    - Support type filter (ASSOCIE, CLIENT, etc.)
    - Support date range filter
    - Return balances array and summary
    - Sort by balance descending
    - _Requirements: 11.1, 11.2, 11.6, 11.8, 11.9_

  - [x] 5.2 Create GET /api/balances/[intervenantId] endpoint
    - Calculate balance for specific intervenant
    - Include all movements
    - Include outstanding advances
    - Return detailed balance data
    - _Requirements: 11.7, 17.1, 17.2, 17.3, 17.4_

- [x] 6. Create Soldes page

  - [x] 6.1 Create app/(dashboard)/soldes/page.tsx

    - Fetch balances from API
    - Display summary cards (total owed to company, total company owes, net)
    - Display balances table with columns: intervenant, type, entries, exits, balance
    - Implement type filter dropdown
    - Implement date range filters
    - Color code balances (red=debt, green=credit, gray=zero)
    - Sort by balance descending
    - Make rows clickable to view details
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7, 11.8, 11.9, 11.10_

  - [x] 6.2 Create BalanceCard component
    - Display intervenant name and type
    - Display total entries and exits
    - Display balance with color coding
    - Display movement count
    - Make clickable
    - _Requirements: 11.3, 11.4, 11.5_

- [ ] 7. Create Intervenant Detail page

  - [ ] 7.1 Create app/(dashboard)/intervenants/[id]/page.tsx

    - Fetch intervenant balance and movements
    - Display summary statistics card
    - Display balance evolution chart
    - Display movements timeline
    - Display outstanding advances section
    - Implement date range filter
    - Implement type filter
    - Implement category filter
    - Add export button
    - _Requirements: 17.1, 17.2, 17.3, 17.4, 17.5, 17.6, 17.9, 17.10_

  - [ ] 7.2 Add notes field to intervenant form
    - Update IntervenantForm component
    - Add textarea for notes
    - Save notes to database
    - _Requirements: 17.8_

## Phase 3: Cash Reconciliation

- [ ] 8. Implement reconciliation API endpoints

  - [ ] 8.1 Create GET /api/reconciliations endpoint

    - Fetch all reconciliations
    - Support date range filter
    - Sort by date descending
    - _Requirements: 12.6, 12.9_

  - [ ] 8.2 Create POST /api/reconciliations endpoint

    - Accept date, physicalCount, note
    - Calculate theoretical balance automatically
    - Calculate gap
    - Save reconciliation record
    - Return created reconciliation
    - _Requirements: 12.2, 12.3, 12.5, 12.8_

  - [ ] 8.3 Create GET /api/reconciliations/current-balance endpoint
    - Calculate current theoretical cash balance
    - Return last reconciliation
    - _Requirements: 12.1, 12.8_

- [ ] 9. Create Rapprochement page
  - [ ] 9.1 Create app/(dashboard)/rapprochement/page.tsx
    - Display current theoretical balance
    - Display physical count input form
    - Calculate and display gap in real-time
    - Display success/warning message based on gap
    - Highlight large gaps in red
    - Add note textarea
    - Add save button
    - Display reconciliation history table
    - Display gap trend chart
    - Implement date range filter for history
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7, 12.9, 12.10_

## Phase 4: Movement Categorization

- [ ] 10. Update movement forms and API

  - [ ] 10.1 Update MouvementForm component

    - Add category dropdown
    - Include all categories: SALAIRES, ACHATS_STOCK, FRAIS_GENERAUX, AVANCES_ASSOCIES, VENTES, CHARGES_FIXES, AUTRES
    - Make category optional
    - _Requirements: 13.1, 13.2_

  - [ ] 10.2 Update movement API endpoints

    - Update POST /api/mouvements to accept category
    - Update PATCH /api/mouvements/[id] to accept category
    - Update GET /api/mouvements to support category filter
    - _Requirements: 13.2, 13.7_

  - [ ] 10.3 Update mouvements page filters
    - Add category multi-select filter
    - Update fetchMouvements to include category filter
    - _Requirements: 13.7_

- [ ] 11. Implement category reports

  - [ ] 11.1 Create GET /api/reports/categories endpoint

    - Accept date range and type filters
    - Calculate totals by category
    - Calculate percentages
    - Return category summaries
    - _Requirements: 13.3, 13.4, 13.8, 13.9_

  - [ ] 11.2 Create app/(dashboard)/rapports/categories/page.tsx

    - Display date range filter
    - Display type filter (ENTREE/SORTIE)
    - Display category summary table
    - Display pie chart for distribution
    - Display bar chart for monthly comparison
    - Add export to Excel button
    - _Requirements: 13.3, 13.4, 13.5, 13.6, 13.9, 13.10_

  - [ ] 11.3 Create CategoryPieChart component

    - Use recharts library
    - Display category distribution
    - Show percentages
    - _Requirements: 13.5_

  - [ ] 11.4 Create MonthlyComparisonChart component
    - Use recharts library
    - Display monthly category trends
    - _Requirements: 13.6_

## Phase 5: Advance Management

- [ ] 12. Implement advance API endpoints

  - [ ] 12.1 Create GET /api/advances endpoint

    - Fetch all advances with reimbursements
    - Support status filter
    - Support intervenant filter
    - Support date range filter
    - Calculate remaining balance for each
    - _Requirements: 14.4, 14.9, 14.11_

  - [ ] 12.2 Create POST /api/advances endpoint

    - Accept date, intervenantId, amount, dueDate, note
    - Create Advance record
    - Create associated SORTIE Mouvement
    - Set default due date from settings
    - Return created advance
    - _Requirements: 14.1, 14.2, 14.12_

  - [ ] 12.3 Create POST /api/advances/[id]/reimburse endpoint

    - Accept date, amount, reference, note
    - Create ENTREE Mouvement linked to advance
    - Update advance status
    - Calculate remaining balance
    - Mark as REMBOURSE_TOTAL if fully reimbursed
    - Return updated advance and reimbursement
    - _Requirements: 14.3, 14.5, 14.6, 14.7_

  - [ ] 12.4 Create GET /api/advances/summary endpoint
    - Calculate total advances given
    - Calculate total reimbursed
    - Calculate total outstanding
    - _Requirements: 14.8_

- [ ] 13. Create Avances page

  - [ ] 13.1 Create app/(dashboard)/avances/page.tsx

    - Display summary cards (total, reimbursed, outstanding)
    - Display advances table with status, intervenant, amount, remaining, days since
    - Implement status filter
    - Implement intervenant filter
    - Implement date range filter
    - Add "Nouvelle Avance" button
    - Add "Rembourser" button per advance
    - Highlight overdue advances in red
    - _Requirements: 14.4, 14.5, 14.6, 14.7, 14.8, 14.9, 14.11, 14.12_

  - [ ] 13.2 Create AdvanceForm component

    - Modal form for creating advance
    - Fields: intervenant, amount, dueDate, note
    - Validation
    - Submit to POST /api/advances
    - _Requirements: 14.2, 14.12_

  - [ ] 13.3 Create ReimbursementForm component

    - Modal form for reimbursing advance
    - Display advance details
    - Fields: amount, reference, note
    - Validation (amount <= remaining)
    - Submit to POST /api/advances/[id]/reimburse
    - _Requirements: 14.3_

  - [ ] 13.4 Create AdvanceCard component

    - Display advance details
    - Display progress bar
    - Display remaining amount
    - Display days since advance
    - Highlight if overdue
    - _Requirements: 14.5, 14.6, 14.7, 14.11, 14.12_

  - [ ] 13.5 Update intervenant detail page
    - Add advances section
    - Display all advances for intervenant
    - Display reimbursement history
    - _Requirements: 14.10_

## Phase 6: Alerts System

- [ ] 14. Implement alert API endpoints

  - [ ] 14.1 Create GET /api/alerts endpoint

    - Fetch all alerts
    - Support dismissed filter
    - Sort by date descending
    - _Requirements: 15.5, 15.10_

  - [ ] 14.2 Create POST /api/alerts/check endpoint

    - Run alert checking logic
    - Create new alerts if conditions met
    - Return count of alerts created
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ] 14.3 Create PATCH /api/alerts/[id]/dismiss endpoint
    - Mark alert as dismissed
    - Record dismissedAt and dismissedBy
    - Return updated alert
    - _Requirements: 15.9_

- [ ] 15. Create alert components and integration

  - [ ] 15.1 Create AlertBanner component

    - Display active alerts
    - Show alert icon and count
    - Display alert title and message
    - Add dismiss button per alert
    - Add "View All" link
    - _Requirements: 15.5, 15.7, 15.9_

  - [ ] 15.2 Add alert badge to navigation

    - Display alert count
    - Make clickable to view alerts
    - Update count in real-time
    - _Requirements: 15.7_

  - [ ] 15.3 Create alert checking background job

    - Run every 5 minutes
    - Call POST /api/alerts/check
    - Update alert count in UI
    - _Requirements: 15.1, 15.2, 15.3, 15.4_

  - [ ] 15.4 Add alerts to dashboard
    - Display AlertBanner on dashboard
    - Make alerts clickable to navigate to relevant page
    - _Requirements: 15.5, 15.8, 18.5_

## Phase 7: Settings and Configuration

- [ ] 16. Implement settings API endpoints

  - [ ] 16.1 Create GET /api/settings endpoint

    - Fetch current settings
    - Create default settings if not exists
    - _Requirements: 19.1_

  - [ ] 16.2 Create PATCH /api/settings endpoint
    - Accept partial settings update
    - Validate all values
    - Save settings
    - Return updated settings
    - _Requirements: 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8_

- [ ] 17. Create Settings page
  - [ ] 17.1 Create app/(dashboard)/parametres/page.tsx (Admin only)
    - Display alert thresholds section (debt, min cash, gap)
    - Display advance settings section (default due days)
    - Display company information section (name, logo, address)
    - Display currency settings section
    - Display feature toggles section (alerts, categories, advances)
    - Add save button
    - Display success message on save
    - Add reset to defaults button
    - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5, 19.6, 19.7, 19.8, 19.9, 19.10_

## Phase 8: Dashboard and Reports

- [ ] 18. Implement dashboard API endpoint

  - [ ] 18.1 Create GET /api/reports/dashboard endpoint
    - Calculate current balance
    - Calculate total outstanding debts
    - Calculate total advances
    - Calculate monthly change
    - Fetch recent movements (last 10)
    - Calculate top debtors (top 5)
    - Fetch active alerts
    - Calculate balance trend (last 30 days)
    - Calculate today's movements
    - Return DashboardData
    - _Requirements: 18.2, 18.3, 18.4, 18.5, 18.6, 18.8_

- [ ] 19. Create Dashboard page

  - [ ] 19.1 Create app/(dashboard)/page.tsx

    - Display summary cards (balance, debts, advances, monthly change)
    - Display recent movements table
    - Display top debtors list
    - Display active alerts banner
    - Display balance trend chart
    - Display quick action buttons (Add Movement, Cash Count, View Advances)
    - Display today's summary
    - Auto-refresh every 5 minutes
    - _Requirements: 18.1, 18.2, 18.3, 18.4, 18.5, 18.6, 18.7, 18.8, 18.10_

  - [ ] 19.2 Create BalanceTrendChart component

    - Use recharts library
    - Display line chart of balance over time
    - _Requirements: 18.6_

  - [ ] 19.3 Update navigation to redirect to dashboard
    - Change default route from /mouvements to /
    - Update middleware
    - _Requirements: 18.1_

- [ ] 20. Implement export functionality

  - [ ] 20.1 Install export dependencies

    - Add exceljs package
    - Add pdfkit package
    - _Requirements: 16.1, 16.2, 16.4_

  - [ ] 20.2 Create lib/export.ts

    - Implement exportMovementsToExcel function
    - Implement exportBalancesToExcel function
    - Implement exportIntervenantToPDF function
    - _Requirements: 16.1, 16.2, 16.4_

  - [ ] 20.3 Create export API endpoints

    - Create GET /api/reports/export/movements endpoint
    - Create GET /api/reports/export/balances endpoint
    - Create GET /api/reports/export/intervenant/[id] endpoint
    - Return file downloads
    - _Requirements: 16.1, 16.2, 16.4_

  - [ ] 20.4 Add export buttons to pages
    - Add export button to mouvements page
    - Add export button to soldes page
    - Add export button to intervenant detail page
    - Add export button to categories report page
    - _Requirements: 16.1, 16.2, 16.4, 13.10, 17.10_

- [ ] 21. Create reports navigation
  - [ ] 21.1 Add Rapports menu item
    - Add to navigation menu
    - Create submenu for Categories, Dashboard
    - _Requirements: 16.5_

## Phase 9: Charts and Visualizations

- [ ] 22. Install and configure charting library

  - [ ] 22.1 Install recharts

    - Add recharts package
    - Configure for Next.js
    - _Requirements: 16.5, 16.6, 16.7_

  - [ ] 22.2 Create chart components
    - Create BalanceTrendChart component
    - Create CategoryPieChart component
    - Create MonthlyComparisonChart component
    - Create GapTrendChart component
    - Make responsive
    - _Requirements: 12.10, 13.5, 13.6, 16.6, 16.7, 18.6_

## Phase 10: Testing and Polish

- [ ] 23. Write unit tests

  - Test calculateIntervenantBalance function
  - Test calculateTheoreticalCashBalance function
  - Test calculateAdvanceRemaining function
  - Test determineAdvanceStatus function
  - Test alert generation logic
  - Test export functions

- [ ] 24. Write integration tests

  - Test GET /api/balances endpoint
  - Test GET /api/reconciliations endpoint
  - Test POST /api/reconciliations endpoint
  - Test GET /api/advances endpoint
  - Test POST /api/advances endpoint
  - Test POST /api/advances/[id]/reimburse endpoint
  - Test GET /api/alerts endpoint
  - Test POST /api/alerts/check endpoint
  - Test GET /api/settings endpoint
  - Test PATCH /api/settings endpoint
  - Test GET /api/reports/dashboard endpoint
  - Test export endpoints

- [ ] 25. Update seed data

  - Add sample advances
  - Add sample reconciliations
  - Add sample alerts
  - Add default settings
  - Add categories to existing movements

- [ ] 26. Update documentation

  - Update README with new features
  - Document new API endpoints
  - Add screenshots of new pages
  - Document configuration options

- [ ] 27. Final checkpoint
  - Ensure all tests pass
  - Verify all features work end-to-end
  - Check responsive design on mobile
  - Verify performance
  - Ask user for feedback

## Notes

- Each phase builds on the previous one
- Phase 2 (Balance Management) is highest priority and can be implemented first
- Phases can be implemented in parallel by different developers
- Testing should be done incrementally after each phase
- User feedback should be gathered after Phase 2, 5, and 8
