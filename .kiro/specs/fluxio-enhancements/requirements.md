# Requirements Document - Fluxio Enhancements

## Introduction

This document outlines enhancements to the Fluxio cash management system specifically designed for a wholesale beverage depot. These improvements focus on tracking who owes money to the company (employees/associates), cash reconciliation, expense categorization, advance management, alerts, and reporting capabilities.

## Glossary

- **Tenant**: An organization or business using the Fluxio system independently from other organizations
- **Tenant ID**: Unique identifier for each tenant organization
- **Tenant Isolation**: Security mechanism ensuring data from one tenant cannot be accessed by another tenant
- **Super Admin**: System administrator with access to all tenants for management purposes
- **Tenant Slug**: URL-friendly identifier for a tenant (e.g., "company-abc")
- **Solde Intervenant**: The balance for a specific intervenant (positive = company owes them, negative = they owe the company)
- **Avance**: Money given in advance to an employee or associate that must be reimbursed
- **Remboursement**: Payment made to reimburse a previously given advance
- **Rapprochement de Caisse**: Cash reconciliation process comparing physical cash with theoretical balance
- **Écart de Caisse**: Difference between physical cash count and theoretical balance
- **Catégorie**: Classification of movements for expense analysis (Salaries, Stock Purchases, General Expenses, etc.)
- **Seuil d'Alerte**: Alert threshold for debt or low cash balance

## Requirements

### Requirement 11: Intervenant Balance Dashboard

**User Story:** As a manager, I want to see at a glance which employees and associates owe money to the company, so that I can track outstanding debts and follow up on reimbursements.

#### Acceptance Criteria

1. WHEN a user accesses the Soldes page, THE Fluxio SHALL display a table showing each intervenant with their total entries, total exits, and balance
2. THE Fluxio SHALL calculate intervenant balance as (total SORTIE to intervenant - total ENTREE from intervenant)
3. WHEN an intervenant has a positive balance, THE Fluxio SHALL display it in red indicating they owe money to the company
4. WHEN an intervenant has a negative balance, THE Fluxio SHALL display it in green indicating the company owes them money
5. WHEN an intervenant has a zero balance, THE Fluxio SHALL display it in gray
6. WHERE a user applies a type filter, THE Fluxio SHALL display only intervenants of the selected type (ASSOCIE, CLIENT, FOURNISSEUR, etc.)
7. WHEN a user clicks on an intervenant row, THE Fluxio SHALL display a detailed view with all movements for that intervenant
8. THE Fluxio SHALL sort intervenants by balance amount in descending order (highest debt first) by default
9. THE Fluxio SHALL display summary cards showing total amount owed to company, total amount company owes, and net balance
10. THE Fluxio SHALL allow filtering by date range to calculate balances for a specific period

### Requirement 12: Cash Reconciliation

**User Story:** As a manager, I want to perform cash counts and compare them with the theoretical balance, so that I can identify discrepancies and maintain accurate cash records.

#### Acceptance Criteria

1. WHEN a user accesses the Rapprochement page, THE Fluxio SHALL display the current theoretical cash balance
2. WHEN a user enters a physical cash count amount, THE Fluxio SHALL calculate and display the difference (écart)
3. WHEN the écart is zero, THE Fluxio SHALL display a success message in green
4. WHEN the écart is non-zero, THE Fluxio SHALL display a warning message with the difference amount
5. WHEN a user saves a cash reconciliation, THE Fluxio SHALL record the date, theoretical balance, physical count, écart, and optional note
6. THE Fluxio SHALL display a history of all cash reconciliations with date, theoretical balance, physical count, and écart
7. WHEN the écart exceeds a configurable threshold, THE Fluxio SHALL highlight it in red
8. THE Fluxio SHALL calculate theoretical balance as sum of all ENTREE minus sum of all SORTIE where modality is ESPECES
9. THE Fluxio SHALL allow filtering reconciliation history by date range
10. THE Fluxio SHALL display a chart showing écart trends over time

### Requirement 13: Movement Categorization

**User Story:** As a manager, I want to categorize cash movements, so that I can analyze expenses by category and understand where money is being spent.

#### Acceptance Criteria

1. THE Fluxio SHALL support the following movement categories: SALAIRES, ACHATS_STOCK, FRAIS_GENERAUX, AVANCES_ASSOCIES, VENTES, CHARGES_FIXES, AUTRES
2. WHEN creating or editing a movement, THE Fluxio SHALL allow selection of a category (optional field)
3. WHEN a user accesses the Categories report page, THE Fluxio SHALL display total amounts by category
4. THE Fluxio SHALL allow filtering category report by date range and movement type (ENTREE/SORTIE)
5. THE Fluxio SHALL display a pie chart showing expense distribution by category
6. THE Fluxio SHALL display a bar chart comparing categories over time (monthly)
7. WHEN filtering movements, THE Fluxio SHALL allow filtering by category
8. THE Fluxio SHALL calculate category totals separately for ENTREE and SORTIE movements
9. THE Fluxio SHALL display category percentages relative to total expenses or income
10. THE Fluxio SHALL allow exporting category report to Excel

### Requirement 14: Advance and Reimbursement Management

**User Story:** As a manager, I want to track advances given to employees and associates and their reimbursements, so that I can monitor outstanding advances and ensure they are repaid.

#### Acceptance Criteria

1. THE Fluxio SHALL support two new movement types: AVANCE and REMBOURSEMENT
2. WHEN creating an AVANCE movement, THE Fluxio SHALL require an intervenant and amount
3. WHEN creating a REMBOURSEMENT movement, THE Fluxio SHALL allow linking it to a specific AVANCE
4. WHEN a user accesses the Avances page, THE Fluxio SHALL display all advances with their status (EN_COURS, REMBOURSE_PARTIEL, REMBOURSE_TOTAL)
5. THE Fluxio SHALL calculate remaining balance for each advance (advance amount - sum of linked reimbursements)
6. WHEN an advance is fully reimbursed, THE Fluxio SHALL mark it as REMBOURSE_TOTAL
7. WHEN an advance has partial reimbursements, THE Fluxio SHALL mark it as REMBOURSE_PARTIEL
8. THE Fluxio SHALL display a summary showing total advances given, total reimbursed, and total outstanding
9. THE Fluxio SHALL allow filtering advances by intervenant, status, and date range
10. WHEN viewing an intervenant's detail page, THE Fluxio SHALL display all their advances and reimbursements
11. THE Fluxio SHALL calculate days since advance was given for outstanding advances
12. THE Fluxio SHALL allow adding a due date to advances and highlight overdue advances in red

### Requirement 15: Alerts and Notifications

**User Story:** As a manager, I want to receive alerts for important events, so that I can take timely action on critical situations.

#### Acceptance Criteria

1. THE Fluxio SHALL display an alert when an intervenant's debt exceeds a configurable threshold
2. THE Fluxio SHALL display an alert when cash balance falls below a configurable minimum
3. THE Fluxio SHALL display an alert when an advance is overdue (past due date)
4. THE Fluxio SHALL display an alert when cash reconciliation écart exceeds a configurable threshold
5. WHEN a user accesses the dashboard, THE Fluxio SHALL display all active alerts in a dedicated section
6. THE Fluxio SHALL allow users to configure alert thresholds in settings
7. THE Fluxio SHALL display alert count in the navigation bar
8. WHEN a user clicks on an alert, THE Fluxio SHALL navigate to the relevant page with appropriate filters
9. THE Fluxio SHALL allow dismissing alerts that have been addressed
10. THE Fluxio SHALL display alert history showing when alerts were triggered and resolved

### Requirement 16: Reports and Export

**User Story:** As a manager, I want to generate reports and export data, so that I can analyze trends, share information with stakeholders, and maintain records.

#### Acceptance Criteria

1. THE Fluxio SHALL allow exporting filtered movements to Excel format
2. THE Fluxio SHALL allow exporting intervenant balances to Excel format
3. THE Fluxio SHALL generate a monthly summary report showing total entries, exits, balance, and top categories
4. THE Fluxio SHALL allow generating a PDF report for a specific intervenant showing all their movements
5. THE Fluxio SHALL display a dashboard with key metrics: current balance, monthly trend, top debtors, top categories
6. THE Fluxio SHALL display line charts showing balance evolution over time
7. THE Fluxio SHALL display bar charts comparing monthly entries vs exits
8. THE Fluxio SHALL allow selecting date range for all reports and charts
9. THE Fluxio SHALL include company logo and report generation date on PDF reports
10. THE Fluxio SHALL allow scheduling automatic monthly report generation (future enhancement)

### Requirement 17: Enhanced Intervenant Details

**User Story:** As a user, I want to see comprehensive information about each intervenant, so that I can understand their complete financial relationship with the company.

#### Acceptance Criteria

1. WHEN a user clicks on an intervenant, THE Fluxio SHALL display a detail page with summary statistics
2. THE Fluxio SHALL display total entries, total exits, current balance, and number of transactions for the intervenant
3. THE Fluxio SHALL display a timeline of all movements for the intervenant in chronological order
4. THE Fluxio SHALL display all outstanding advances for the intervenant
5. THE Fluxio SHALL display a chart showing the intervenant's balance evolution over time
6. THE Fluxio SHALL allow filtering the intervenant's movements by date range, type, and category
7. THE Fluxio SHALL display the intervenant's contact information if available (future enhancement)
8. THE Fluxio SHALL allow adding notes to an intervenant profile
9. THE Fluxio SHALL display the date of last transaction with the intervenant
10. THE Fluxio SHALL allow exporting the intervenant's complete transaction history

### Requirement 18: Dashboard Home Page

**User Story:** As a user, I want a comprehensive dashboard as the home page, so that I can quickly see the most important information and metrics.

#### Acceptance Criteria

1. WHEN a user logs in, THE Fluxio SHALL redirect to the Dashboard page
2. THE Fluxio SHALL display summary cards showing: current cash balance, total outstanding debts, total advances, and monthly change
3. THE Fluxio SHALL display a list of recent movements (last 10)
4. THE Fluxio SHALL display a list of top debtors (top 5 intervenants with highest debt)
5. THE Fluxio SHALL display active alerts in a prominent section
6. THE Fluxio SHALL display a chart showing balance trend for the last 30 days
7. THE Fluxio SHALL display quick action buttons for common tasks (Add Movement, Cash Count, View Advances)
8. THE Fluxio SHALL display a summary of today's movements (count and total amount)
9. THE Fluxio SHALL allow customizing which widgets are displayed on the dashboard
10. THE Fluxio SHALL refresh dashboard data automatically every 5 minutes

### Requirement 19: Settings and Configuration

**User Story:** As an administrator, I want to configure system settings, so that I can customize the application to match business needs.

#### Acceptance Criteria

1. WHEN an Admin User accesses the Settings page, THE Fluxio SHALL display configuration options
2. THE Fluxio SHALL allow configuring alert thresholds (debt limit, minimum cash, écart threshold)
3. THE Fluxio SHALL allow configuring default advance due date (number of days)
4. THE Fluxio SHALL allow configuring company information (name, logo, address)
5. THE Fluxio SHALL allow configuring default currency and format
6. THE Fluxio SHALL allow enabling/disabling specific features (alerts, categories, advances)
7. THE Fluxio SHALL validate all configuration values before saving
8. WHEN settings are changed, THE Fluxio SHALL apply them immediately without requiring restart
9. THE Fluxio SHALL display a confirmation message when settings are saved successfully
10. THE Fluxio SHALL allow resetting settings to default values

### Requirement 20: Multi-Modality Filter Enhancement

**User Story:** As a user, I want to filter movements by multiple modalities simultaneously, so that I can analyze specific payment methods together.

#### Acceptance Criteria

1. WHEN a user accesses the movement filters, THE Fluxio SHALL display a multi-select dropdown for modalities
2. THE Fluxio SHALL allow selecting one or more modalities (ESPECES, CHEQUE, VIREMENT, STOCK, SALAIRE, AUTRE)
3. WHEN multiple modalities are selected, THE Fluxio SHALL display movements matching any of the selected modalities
4. THE Fluxio SHALL display selected modalities as badges below the filter dropdown
5. THE Fluxio SHALL allow removing individual modalities by clicking on their badge
6. WHEN no modality is selected, THE Fluxio SHALL display all movements regardless of modality
7. THE Fluxio SHALL update the movements list and summary automatically when modality filter changes
8. THE Fluxio SHALL persist modality filter selection when navigating between pages
9. THE Fluxio SHALL include modality filter in exported data
10. THE Fluxio SHALL display a count of selected modalities in the filter button label

### Requirement 21: Multi-Tenancy Support

**User Story:** As a business owner, I want to use Fluxio for my business while allowing other businesses to use the same system independently, so that multiple companies can benefit from the application without data mixing.

#### Acceptance Criteria

1. THE Fluxio SHALL support multiple tenants (organizations) within a single deployment
2. WHEN a new tenant is created, THE Fluxio SHALL generate a unique tenant identifier
3. THE Fluxio SHALL isolate all data (users, intervenants, mouvements, advances, reconciliations, alerts, settings) by tenant
4. WHEN a user logs in, THE Fluxio SHALL associate the user with their tenant and restrict access to only their tenant's data
5. THE Fluxio SHALL prevent users from accessing or viewing data from other tenants
6. WHEN querying the database, THE Fluxio SHALL automatically filter all queries by the current user's tenant ID
7. THE Fluxio SHALL support tenant-specific settings and configuration
8. THE Fluxio SHALL allow tenant-specific branding (logo, company name, colors)
9. WHEN a super admin accesses the system, THE Fluxio SHALL allow viewing and managing all tenants
10. THE Fluxio SHALL support tenant registration with company name, admin email, and password
11. THE Fluxio SHALL generate a unique subdomain or tenant slug for each tenant (e.g., company-abc.fluxio.com or fluxio.com/company-abc)
12. THE Fluxio SHALL ensure referential integrity within each tenant's data
13. WHEN a tenant is deactivated, THE Fluxio SHALL prevent login for all users of that tenant
14. THE Fluxio SHALL support tenant data export for backup purposes
15. THE Fluxio SHALL log all tenant-related operations for audit purposes
