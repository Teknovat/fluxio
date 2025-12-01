# Requirements Document - Fluxio

## Introduction

Fluxio is a web application designed to replace Excel-based cash flow tracking for a beverage depot. The system manages cash movements (entries and exits), intervenants (clients, suppliers, associates, etc.), and users with role-based access control. The application focuses exclusively on cash tracking without managing products or inventory.

## Glossary

- **Fluxio**: The cash management web application system
- **Mouvement**: A cash transaction record (either entry or exit)
- **Entrée**: Money coming into the business (client payments, associate contributions, cash returns)
- **Sortie**: Money going out of the business (supplier payments, salaries, expenses)
- **Intervenant**: An entity involved in cash transactions (client, supplier, associate, bank account, etc.)
- **Solde**: The calculated balance (sum of entries minus sum of exits) for a given period
- **Admin User**: A user with full system access and management capabilities
- **Simple User**: A user with limited access (view and create movements only)
- **Active User**: A user account that is enabled and can log into the system
- **Active Intervenant**: An intervenant that is enabled and available for new transactions

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user of Fluxio, I want to log in with my email and password, so that I can access the cash management system securely.

#### Acceptance Criteria

1. WHEN a user submits valid credentials (email and password), THE Fluxio SHALL authenticate the user and grant access to the system
2. WHEN a user with an inactive account attempts to log in, THE Fluxio SHALL deny access and display an appropriate error message
3. WHEN a user successfully authenticates, THE Fluxio SHALL redirect the user to the Movements page
4. THE Fluxio SHALL store passwords using bcrypt hashing algorithm
5. THE Fluxio SHALL use JWT tokens for session management

### Requirement 2: Role-Based Access Control

**User Story:** As an administrator, I want different permission levels for users, so that I can control who can modify data versus who can only view and create movements.

#### Acceptance Criteria

1. THE Fluxio SHALL support two user roles: ADMIN and USER
2. WHEN an Admin User accesses the navigation menu, THE Fluxio SHALL display options for Mouvements, Intervenants, and Utilisateurs
3. WHEN a Simple User accesses the navigation menu, THE Fluxio SHALL display only the Mouvements option
4. WHEN a Simple User attempts to access admin-only pages, THE Fluxio SHALL deny access and redirect to an authorized page
5. THE Fluxio SHALL enforce role-based permissions on all API endpoints

### Requirement 3: User Management (Admin Only)

**User Story:** As an administrator, I want to manage user accounts, so that I can control who has access to the system and what permissions they have.

#### Acceptance Criteria

1. WHEN an Admin User accesses the Users page, THE Fluxio SHALL display a list of all users with their name, email, role, and active status
2. WHEN an Admin User creates a new user, THE Fluxio SHALL require name, email, password, and role fields
3. WHEN an Admin User edits a user, THE Fluxio SHALL allow modification of name, role, active status, and password reset
4. WHEN an Admin User attempts to deactivate the last active admin account, THE Fluxio SHALL prevent the action and display a warning message
5. THE Fluxio SHALL validate that email addresses are unique across all users

### Requirement 4: Intervenant Management (Admin Only)

**User Story:** As an administrator, I want to manage intervenants, so that I can maintain an accurate list of entities involved in cash transactions.

#### Acceptance Criteria

1. WHEN an Admin User accesses the Intervenants page, THE Fluxio SHALL display a list of all intervenants with their name, type, and active status
2. WHEN an Admin User creates a new intervenant, THE Fluxio SHALL require name and type fields (CLIENT, FOURNISSEUR, ASSOCIE, CAISSE_BANQUE, or AUTRE)
3. WHEN an Admin User edits an intervenant, THE Fluxio SHALL allow modification of name, type, and active status
4. WHEN an intervenant is deactivated, THE Fluxio SHALL exclude it from the dropdown list for new movements
5. WHEN displaying historical movements, THE Fluxio SHALL show deactivated intervenants associated with existing transactions
6. WHERE the Admin User applies a type filter, THE Fluxio SHALL display only intervenants matching the selected type

### Requirement 5: Movement Listing and Filtering

**User Story:** As a user, I want to view and filter cash movements, so that I can track and analyze cash flow for specific periods or intervenants.

#### Acceptance Criteria

1. WHEN a user accesses the Movements page, THE Fluxio SHALL display a table with columns for date, intervenant name, type, amount, reference, modality, and note
2. WHEN a user applies date filters (date_from and date_to), THE Fluxio SHALL display only movements within the specified date range
3. WHERE a user selects a specific intervenant filter, THE Fluxio SHALL display only movements associated with that intervenant
4. WHERE a user selects a type filter (ENTREE or SORTIE), THE Fluxio SHALL display only movements of the selected type
5. WHEN movements are filtered, THE Fluxio SHALL display summary totals showing total_entrée, total_sortie, and solde (balance)
6. THE Fluxio SHALL calculate solde as the sum of all ENTREE amounts minus the sum of all SORTIE amounts for the filtered results
7. THE Fluxio SHALL display movements in descending order by date (most recent first)

### Requirement 6: Movement Creation

**User Story:** As a user, I want to create new cash movements, so that I can record money coming in or going out of the business.

#### Acceptance Criteria

1. WHEN a user clicks the "Ajouter un mouvement" button, THE Fluxio SHALL display a movement creation form
2. THE Fluxio SHALL require date, intervenant, type (ENTREE or SORTIE), and amount fields for movement creation
3. THE Fluxio SHALL default the date field to the current date
4. THE Fluxio SHALL populate the intervenant dropdown with only active intervenants
5. WHEN a user submits a movement with amount less than or equal to zero, THE Fluxio SHALL reject the submission and display a validation error
6. THE Fluxio SHALL allow optional fields for reference, modality (ESPECES, CHEQUE, VIREMENT, STOCK, AUTRE), and note
7. WHEN a movement is successfully created, THE Fluxio SHALL refresh the movements list and display the new entry

### Requirement 7: Movement Editing (Admin Only)

**User Story:** As an administrator, I want to edit existing movements, so that I can correct errors or update transaction details.

#### Acceptance Criteria

1. WHEN an Admin User views the movements list, THE Fluxio SHALL display an "Edit" action for each movement row
2. WHEN a Simple User views the movements list, THE Fluxio SHALL not display edit or delete actions
3. WHEN an Admin User clicks edit on a movement, THE Fluxio SHALL display a form pre-filled with the current movement data
4. WHEN an Admin User saves changes to a movement, THE Fluxio SHALL validate all required fields and update the movement record
5. THE Fluxio SHALL update the updated_at timestamp when a movement is modified

### Requirement 8: Movement Deletion (Admin Only)

**User Story:** As an administrator, I want to delete movements, so that I can remove erroneous or duplicate entries.

#### Acceptance Criteria

1. WHEN an Admin User views the movements list, THE Fluxio SHALL display a "Delete" action for each movement row
2. WHEN an Admin User clicks delete on a movement, THE Fluxio SHALL display a confirmation dialog
3. WHEN an Admin User confirms deletion, THE Fluxio SHALL permanently remove the movement from the database
4. WHEN a movement is deleted, THE Fluxio SHALL refresh the movements list and recalculate summary totals

### Requirement 9: Data Persistence

**User Story:** As a system administrator, I want all data stored reliably, so that cash flow records are preserved and can be backed up easily.

#### Acceptance Criteria

1. THE Fluxio SHALL use Prisma ORM for database operations
2. THE Fluxio SHALL use SQLite as the database engine
3. THE Fluxio SHALL store timestamps (created_at, updated_at) for all User, Intervenant, and Mouvement records
4. THE Fluxio SHALL maintain referential integrity between Mouvement and Intervenant entities
5. WHEN a Mouvement references an Intervenant, THE Fluxio SHALL prevent deletion of the Intervenant record

### Requirement 10: User Interface Navigation

**User Story:** As a user, I want clear navigation between different sections of the application, so that I can easily access the features I need.

#### Acceptance Criteria

1. THE Fluxio SHALL display a navigation menu with links to accessible pages based on user role
2. THE Fluxio SHALL provide a logout button in the navigation menu
3. WHEN a user clicks logout, THE Fluxio SHALL invalidate the session and redirect to the login page
4. THE Fluxio SHALL highlight the current active page in the navigation menu
5. WHEN a user is not authenticated, THE Fluxio SHALL redirect all page requests to the login page
