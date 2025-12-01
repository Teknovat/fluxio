# Implementation Plan - Fluxio

## Task List

- [x] 1. Initialize Next.js project with TypeScript and dependencies

  - Create Next.js 14+ project with App Router and TypeScript
  - Install dependencies: Prisma, bcrypt, jsonwebtoken, zod, TailwindCSS
  - Configure TypeScript with strict mode
  - Set up TailwindCSS configuration
  - Create basic folder structure (app, components, lib, types)
  - _Requirements: 9.1, 9.2_

- [x] 2. Set up Prisma and database schema

  - Initialize Prisma with SQLite provider
  - Define User model with Role enum (ADMIN, USER)
  - Define Intervenant model with IntervenantType enum
  - Define Mouvement model with MouvementType and Modality enums
  - Add indexes for date, intervenantId, and type on Mouvement
  - Configure onDelete: Restrict for intervenant relation
  - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [x] 3. Create database seed script

  - Write seed.ts to create default admin user
  - Hash password using bcrypt before seeding
  - Add sample intervenants for testing (optional)
  - Configure package.json seed script
  - _Requirements: 1.4, 3.2_

- [x] 4. Implement authentication utilities

  - [x] 4.1 Create lib/auth.ts with JWT and bcrypt functions
    - Implement hashPassword function using bcrypt (salt rounds = 10)
    - Implement comparePassword function for verification
    - Implement generateToken function to create JWT with userId, email, role
    - Implement verifyToken function to validate and decode JWT
    - Define JWTPayload interface
    - _Requirements: 1.1, 1.4, 1.5_
  - [x] 4.2 Create lib/prisma.ts singleton
    - Export PrismaClient singleton instance
    - Handle connection pooling for production
    - _Requirements: 9.1_

- [x] 5. Create validation schemas

  - Define loginSchema (email, password)
  - Define createUserSchema (name, email, password, role)
  - Define updateUserSchema (optional fields)
  - Define createIntervenantSchema (name, type)
  - Define updateIntervenantSchema (optional fields)
  - Define createMouvementSchema (date, intervenantId, type, amount, optional fields)
  - Define mouvementFiltersSchema (optional filter fields)
  - _Requirements: 1.1, 3.2, 4.2, 6.2, 6.5_

- [x] 6. Create TypeScript types and interfaces

  - Define Role, IntervenantType, MouvementType, Modality enums
  - Define User, Intervenant, Mouvement interfaces
  - Define MouvementSummary and MouvementFilters interfaces
  - Export all types from types/index.ts
  - _Requirements: 2.1, 4.2, 5.4, 6.2_

- [x] 7. Implement authentication API routes

  - [x] 7.1 Create POST /api/auth/login route
    - Validate request body with loginSchema
    - Query user by email from database
    - Check if user exists and is active
    - Compare password with bcrypt
    - Generate JWT token on success
    - Set httpOnly cookie with token
    - Return user data (without password) and token
    - Handle errors: invalid credentials, inactive account
    - _Requirements: 1.1, 1.2, 1.3, 1.5_
  - [x] 7.2 Create POST /api/auth/logout route
    - Clear auth-token cookie
    - Return success response
    - _Requirements: 10.3_

- [x] 8. Implement API middleware for authorization

  - Create requireAuth function to extract and verify JWT from cookies
  - Create requireAdmin function that calls requireAuth and checks ADMIN role
  - Handle 401 errors for missing/invalid tokens
  - Handle 403 errors for insufficient permissions
  - _Requirements: 2.5, 3.1, 4.1_

- [x] 9. Implement user management API routes (Admin only)

  - [x] 9.1 Create GET /api/users route
    - Use requireAdmin middleware
    - Fetch all users from database
    - Exclude password field from response
    - _Requirements: 3.1_
  - [x] 9.2 Create POST /api/users route
    - Use requireAdmin middleware
    - Validate request with createUserSchema
    - Check email uniqueness
    - Hash password with bcrypt
    - Create user in database
    - Return created user (without password)
    - _Requirements: 3.2, 3.5_
  - [x] 9.3 Create PATCH /api/users/[id] route
    - Use requireAdmin middleware
    - Validate request with updateUserSchema
    - If deactivating admin, check if last active admin
    - If updating password, hash with bcrypt
    - Update user in database
    - Return updated user (without password)
    - _Requirements: 3.3, 3.4_

- [x] 10. Implement intervenant management API routes

  - [x] 10.1 Create GET /api/intervenants route
    - Use requireAuth middleware (accessible to all authenticated users)
    - Parse query params: type, active filters
    - Fetch filtered intervenants from database
    - Return intervenant list
    - _Requirements: 4.1, 4.6_
  - [x] 10.2 Create POST /api/intervenants route
    - Use requireAdmin middleware
    - Validate request with createIntervenantSchema
    - Create intervenant in database
    - Return created intervenant
    - _Requirements: 4.2_
  - [x] 10.3 Create PATCH /api/intervenants/[id] route
    - Use requireAdmin middleware
    - Validate request with updateIntervenantSchema
    - Update intervenant in database
    - Return updated intervenant
    - _Requirements: 4.3_

- [x] 11. Implement mouvement management API routes

  - [x] 11.1 Create GET /api/mouvements route
    - Use requireAuth middleware
    - Parse query params: dateFrom, dateTo, intervenantId, type
    - Build Prisma query with filters and include intervenant data
    - Order by date descending
    - Calculate summary: totalEntree, totalSortie, solde
    - Return mouvements array and summary object
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7_
  - [x] 11.2 Create POST /api/mouvements route
    - Use requireAuth middleware
    - Validate request with createMouvementSchema
    - Verify intervenant exists and is active
    - Validate amount > 0
    - Create mouvement in database
    - Return created mouvement with intervenant data
    - _Requirements: 6.1, 6.2, 6.4, 6.5, 6.7_
  - [x] 11.3 Create PATCH /api/mouvements/[id] route
    - Use requireAdmin middleware
    - Validate request with createMouvementSchema
    - Verify intervenant exists (can be inactive for edits)
    - Update mouvement in database
    - Return updated mouvement
    - _Requirements: 7.1, 7.3, 7.4, 7.5_
  - [x] 11.4 Create DELETE /api/mouvements/[id] route
    - Use requireAdmin middleware
    - Delete mouvement from database
    - Return success response
    - _Requirements: 8.1, 8.3_

- [x] 12. Create Next.js middleware for route protection

  - Create middleware.ts at root level
  - Check for auth-token cookie on all protected routes
  - Redirect to /login if no token on protected routes
  - Redirect to /mouvements if token exists on /login
  - Verify token and check role for admin-only routes (/intervenants, /utilisateurs)
  - Redirect non-admin users to /mouvements if accessing admin routes
  - Configure matcher to exclude API routes and static files
  - _Requirements: 2.3, 2.4, 10.5_

- [x] 13. Build login page UI

  - Create app/(auth)/login/page.tsx
  - Build login form with email and password fields
  - Add client-side validation
  - Handle form submission to POST /api/auth/login
  - Display error messages for invalid credentials or inactive account
  - Redirect to /mouvements on successful login
  - Store user data in client state or context
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 14. Create dashboard layout with navigation

  - Create app/(dashboard)/layout.tsx
  - Build navigation bar with Fluxio logo
  - Add navigation links: Mouvements (all users), Intervenants (admin), Utilisateurs (admin)
  - Fetch current user data from JWT or API
  - Show/hide nav items based on user role
  - Add logout button that calls POST /api/auth/logout
  - Highlight active page in navigation
  - Make layout responsive with mobile menu
  - _Requirements: 2.2, 2.3, 10.1, 10.2, 10.4_

- [x] 15. Build mouvements page with filters and table

  - [x] 15.1 Create app/(dashboard)/mouvements/page.tsx
    - Fetch mouvements from GET /api/mouvements on page load
    - Fetch intervenants list for filter dropdown
    - Display loading state while fetching
    - _Requirements: 5.1_
  - [x] 15.2 Implement filter controls
    - Add date range inputs (dateFrom, dateTo)
    - Add intervenant dropdown filter (all intervenants)
    - Add type filter dropdown (ALL, ENTREE, SORTIE)
    - Add "Clear filters" button
    - Apply filters on change and refetch mouvements
    - _Requirements: 5.2, 5.3, 5.4_
  - [x] 15.3 Display summary cards
    - Show Total Entrée card (green styling)
    - Show Total Sortie card (red styling)
    - Show Solde card (blue if positive, red if negative)
    - Update cards when filters change
    - _Requirements: 5.5, 5.6_
  - [x] 15.4 Build mouvements data table
    - Display columns: date, intervenant name, type, amount, reference, modality, note
    - Show edit and delete buttons for admin users only
    - Format date and amount appropriately
    - Make table responsive (collapse to cards on mobile)
    - _Requirements: 5.1, 5.7, 7.1, 7.2, 8.1_
  - [x] 15.5 Add "Ajouter un mouvement" button
    - Position button prominently above or beside table
    - Open modal/form when clicked
    - _Requirements: 6.1_

- [x] 16. Create mouvement form component

  - [x] 16.1 Build form UI
    - Create modal or slide-over component
    - Add date input (default to today)
    - Add intervenant dropdown (only active intervenants)
    - Add type radio buttons or select (ENTREE, SORTIE)
    - Add amount number input
    - Add optional reference text input
    - Add optional modality select (ESPECES, CHEQUE, VIREMENT, AUTRE)
    - Add optional note textarea
    - Add submit and cancel buttons
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.6_
  - [x] 16.2 Implement form validation and submission
    - Validate required fields client-side
    - Validate amount > 0
    - Submit to POST /api/mouvements for create
    - Submit to PATCH /api/mouvements/[id] for edit (admin only)
    - Display validation errors inline
    - Show loading state during submission
    - Close modal and refresh list on success
    - Display error toast on failure
    - _Requirements: 6.5, 6.7, 7.3, 7.4_

- [x] 17. Implement mouvement edit functionality (Admin only)

  - Add click handler to edit button in table row
  - Fetch mouvement data and populate form
  - Reuse mouvement form component in edit mode
  - Submit to PATCH /api/mouvements/[id]
  - Refresh mouvements list after successful edit
  - _Requirements: 7.1, 7.3, 7.4, 7.5_

- [x] 18. Implement mouvement delete functionality (Admin only)

  - Add click handler to delete button in table row
  - Show confirmation dialog with mouvement details
  - Submit DELETE request to /api/mouvements/[id] on confirm
  - Refresh mouvements list and recalculate summary after deletion
  - Display success toast
  - _Requirements: 8.1, 8.2, 8.3, 8.4_

- [x] 19. Build intervenants management page (Admin only)

  - [x] 19.1 Create app/(dashboard)/intervenants/page.tsx
    - Fetch intervenants from GET /api/intervenants
    - Display loading state
    - _Requirements: 4.1_
  - [x] 19.2 Build intervenants table
    - Display columns: name, type, active status
    - Add type filter dropdown
    - Show edit and activate/deactivate buttons
    - Make table responsive
    - _Requirements: 4.1, 4.6_
  - [x] 19.3 Add "Ajouter un intervenant" button
    - Position button above table
    - Open modal/form when clicked
    - _Requirements: 4.2_

- [x] 20. Create intervenant form component

  - [x] 20.1 Build form UI
    - Create modal component
    - Add name text input
    - Add type select (CLIENT, FOURNISSEUR, ASSOCIE, CAISSE_BANQUE, AUTRE)
    - Add active checkbox (for edit mode)
    - Add submit and cancel buttons
    - _Requirements: 4.2, 4.3_
  - [x] 20.2 Implement form submission
    - Validate name and type required
    - Submit to POST /api/intervenants for create
    - Submit to PATCH /api/intervenants/[id] for edit
    - Close modal and refresh list on success
    - Display error messages
    - _Requirements: 4.2, 4.3_

- [x] 21. Implement intervenant edit and activation toggle

  - Add click handler to edit button
  - Populate form with intervenant data
  - Add toggle for active/inactive status
  - Submit to PATCH /api/intervenants/[id]
  - Refresh intervenants list after update
  - _Requirements: 4.3, 4.4_

- [x] 22. Build users management page (Admin only)

  - [x] 22.1 Create app/(dashboard)/utilisateurs/page.tsx
    - Fetch users from GET /api/users
    - Display loading state
    - _Requirements: 3.1_
  - [x] 22.2 Build users table
    - Display columns: name, email, role, active status
    - Show edit button for each user
    - Make table responsive
    - _Requirements: 3.1_
  - [x] 22.3 Add "Ajouter un utilisateur" button
    - Position button above table
    - Open modal/form when clicked
    - _Requirements: 3.2_

- [x] 23. Create user form component

  - [x] 23.1 Build form UI
    - Create modal component
    - Add name text input
    - Add email input
    - Add password input (required for create, optional for edit)
    - Add role select (ADMIN, USER)
    - Add active checkbox (for edit mode)
    - Add submit and cancel buttons
    - _Requirements: 3.2, 3.3_
  - [x] 23.2 Implement form validation and submission
    - Validate name, email, password (min 6 chars), role
    - Check email format
    - Submit to POST /api/users for create
    - Submit to PATCH /api/users/[id] for edit
    - Handle error: duplicate email
    - Handle error: cannot deactivate last admin
    - Close modal and refresh list on success
    - _Requirements: 3.2, 3.3, 3.4, 3.5_

- [x] 24. Implement user edit functionality

  - Add click handler to edit button
  - Populate form with user data
  - Allow editing name, role, active status, password reset
  - Submit to PATCH /api/users/[id]
  - Display warning if attempting to deactivate last admin
  - Refresh users list after update
  - _Requirements: 3.3, 3.4_

- [ ] 25. Create reusable UI components

  - Build Button component with variants (primary, secondary, danger)
  - Build Input component with validation states
  - Build Select/Dropdown component
  - Build Modal component with overlay
  - Build Toast/Notification component for success/error messages
  - Build Table component with responsive behavior
  - Build Card component for summary display
  - _Requirements: 5.1, 6.1, 10.1_

- [ ] 26. Add error handling and loading states

  - Implement global error boundary
  - Add loading spinners for async operations
  - Display toast notifications for API errors
  - Show inline validation errors in forms
  - Add empty states for tables with no data
  - Handle network errors gracefully
  - _Requirements: 1.2, 6.5_

- [ ] 27. Style application with TailwindCSS

  - Apply consistent color scheme (green for entrée, red for sortie, blue for solde)
  - Style navigation bar and layout
  - Style forms and inputs
  - Style tables and cards
  - Add hover and focus states
  - Ensure responsive design for mobile devices
  - Add transitions and animations for better UX
  - _Requirements: 10.1, 10.4_

- [ ] 28. Run database migrations and seed

  - Execute `npx prisma migrate dev` to create database
  - Run `npx prisma db seed` to create default admin user
  - Verify database schema and seed data
  - _Requirements: 9.1, 9.2, 9.3_

- [ ] 29. Test application end-to-end

  - Test login flow with valid and invalid credentials
  - Test admin user can access all pages
  - Test simple user can only access mouvements page
  - Test creating, editing, deleting mouvements (admin)
  - Test creating mouvements (simple user)
  - Test creating, editing, activating/deactivating intervenants
  - Test creating, editing users
  - Test filters on mouvements page
  - Test summary calculations (solde)
  - Test that inactive intervenants don't appear in dropdown
  - Test cannot deactivate last admin
  - Test logout functionality
  - _Requirements: All_

- [ ] 30. Create environment configuration and documentation
  - Create .env.example file with required variables
  - Write README.md with setup instructions
  - Document how to run development server
  - Document how to run migrations and seed
  - Document default admin credentials
  - Add deployment instructions for Vercel/Railway
  - _Requirements: 9.1_
