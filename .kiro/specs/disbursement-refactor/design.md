# Design Document - Disbursement Module & Cash Dashboard

## Overview

This design document details the technical implementation for refactoring the Advance module into a Disbursement module and creating a new Cash Dashboard. The refactor introduces a clearer distinction between real cash movements and justification records, while the Cash Dashboard provides real-time visibility into cash position.

## Architecture

### Key Conceptual Changes

**Before (Advance Model):**

- Advance = cash outflow
- Reimbursement = cash inflow (always creates a movement)
- Confusing when funds are used vs returned

**After (Disbursement Model):**

- Disbursement = cash outflow (real money leaving)
- Justification = proof of use (NO cash movement, just documentation)
- Return to Cash = cash inflow (real money coming back)

### Database Schema Changes

```prisma
// NEW: Disbursement model (replaces Advance)
model Disbursement {
  id              String          @id @default(cuid())
  tenantId        String
  mouvementId     String          @unique
  mouvement       Mouvement       @relation("DisbursementMovement", fields: [mouvementId], references: [id])
  intervenantId   String
  intervenant     Intervenant     @relation(fields: [intervenantId], references: [id], onDelete: Restrict)
  initialAmount   Float
  remainingAmount Float
  dueDate         DateTime?
  status          String          @default("OPEN") // OPEN, PARTIALLY_JUSTIFIED, JUSTIFIED
  category        String?         // STOCK_PURCHASE, BANK_DEPOSIT, SALARY_ADVANCE, GENERAL_EXPENSE, OTHER
  justifications  Justification[]
  returns         Mouvement[]     @relation("DisbursementReturns")
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@index([tenantId])
  @@index([tenantId, intervenantId])
  @@index([tenantId, status])
  @@index([intervenantId])
  @@index([status])
  @@index([dueDate])
}

// NEW: Justification model (replaces reimbursement movements)
model Justification {
  id             String       @id @default(cuid())
  tenantId       String
  disbursementId String
  disbursement   Disbursement @relation(fields: [disbursementId], references: [id], onDelete: Cascade)
  date           DateTime
  amount         Float
  category       String       // Must match or be subcategory of disbursement category
  reference      String?
  note           String?
  attachments    String?      // JSON array of file paths (future)
  createdBy      String
  createdAt      DateTime     @default(now())
  updatedAt      DateTime     @updatedAt

  @@index([tenantId])
  @@index([disbursementId])
  @@index([date])
}

// UPDATED: Mouvement model
model Mouvement {
  id                  String        @id @default(cuid())
  tenantId            String
  tenant              Tenant        @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  date                DateTime
  intervenantId       String
  intervenant         Intervenant   @relation(fields: [intervenantId], references: [id], onDelete: Restrict)
  type                String        // ENTREE or SORTIE
  amount              Float
  reference           String?
  modality            String?       // ESPECES, CHEQUE, VIREMENT, AUTRE
  category            String?
  note                String?
  isDisbursement      Boolean       @default(false) // Renamed from isAdvance
  disbursementId      String?       // Renamed from advanceId
  disbursement        Disbursement? @relation("DisbursementReturns", fields: [disbursementId], references: [id])
  linkedDisbursement  Disbursement? @relation("DisbursementMovement")
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  @@index([tenantId])
  @@index([tenantId, date])
  @@index([tenantId, intervenantId])
  @@index([tenantId, type])
  @@index([tenantId, category])
  @@index([date])
  @@index([intervenantId])
  @@index([type])
  @@index([disbursementId])
}

// UPDATED: Intervenant model
model Intervenant {
  id            String         @id @default(cuid())
  tenantId      String
  tenant        Tenant         @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  name          String
  type          String
  active        Boolean        @default(true)
  notes         String?
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  mouvements    Mouvement[]
  disbursements Disbursement[] // Renamed from advances

  @@index([tenantId])
  @@index([tenantId, type])
}
```

### New Enums

```typescript
export enum DisbursementStatus {
  OPEN = "OPEN",
  PARTIALLY_JUSTIFIED = "PARTIALLY_JUSTIFIED",
  JUSTIFIED = "JUSTIFIED",
}

export enum DisbursementCategory {
  STOCK_PURCHASE = "STOCK_PURCHASE",
  BANK_DEPOSIT = "BANK_DEPOSIT",
  SALARY_ADVANCE = "SALARY_ADVANCE",
  GENERAL_EXPENSE = "GENERAL_EXPENSE",
  OTHER = "OTHER",
}

export enum JustificationCategory {
  STOCK_PURCHASE = "STOCK_PURCHASE",
  BANK_DEPOSIT = "BANK_DEPOSIT",
  SALARY = "SALARY",
  TRANSPORT = "TRANSPORT",
  SUPPLIES = "SUPPLIES",
  UTILITIES = "UTILITIES",
  OTHER = "OTHER",
}
```

## API Endpoints

### Disbursement Endpoints

**GET /api/disbursements**

- Query params: `?status=OPEN&intervenantId=xxx&dateFrom=2024-01-01&dateTo=2024-12-31&category=STOCK_PURCHASE`
- Response: `Disbursement[]` with calculated remaining amounts
- Includes: intervenant, mouvement, justifications, returns

**POST /api/disbursements**

- Request: `{ date, intervenantId, amount, category, dueDate?, note? }`
- Creates: Disbursement + SORTIE Mouvement
- Response: `Disbursement`

**GET /api/disbursements/[id]**

- Response: `Disbursement` with full details
- Includes: all justifications, all returns, calculated totals

**GET /api/disbursements/summary**

- Response: `{ totalDisbursed, totalJustified, totalOutstanding, byCategory }`

### Justification Endpoints

**POST /api/disbursements/[id]/justify**

- Request: `{ date, amount, category, reference?, note? }`
- Creates: Justification record (NO movement)
- Updates: Disbursement remainingAmount and status
- Response: `{ disbursement, justification }`

**GET /api/disbursements/[id]/justifications**

- Response: `Justification[]` for the disbursement

### Return to Cash Endpoints

**POST /api/disbursements/[id]/return**

- Request: `{ date, amount, reference?, note? }`
- Creates: ENTREE Mouvement linked to disbursement
- Updates: Disbursement remainingAmount and status
- Response: `{ disbursement, movement }`

### Cash Dashboard Endpoints

**GET /api/cash/dashboard**

- Response: `CashDashboardData`

```typescript
interface CashDashboardData {
  currentBalance: number;
  todayInflows: number;
  todayOutflows: number;
  netChangeToday: number;
  recentMovements: Mouvement[]; // Last 20
  balanceTrend: { date: string; balance: number }[]; // Last 30 days
  outstandingDisbursements: number;
  alerts: Alert[];
}
```

**GET /api/cash/balance**

- Response: `{ balance: number, lastUpdated: Date }`
- Calculates from all ESPECES movements

**POST /api/cash/inflow**

- Request: `{ date, amount, category, intervenantId?, reference?, note? }`
- Creates: ENTREE Mouvement
- Response: `Mouvement`

## Components and Pages

### New Pages

#### 1. Cash Dashboard (`/dashboard` or `/`)

```typescript
// app/(dashboard)/dashboard/page.tsx

export default function CashDashboardPage() {
  // Current balance card (large, prominent)
  // Today's summary cards (inflows, outflows, net)
  // Quick action buttons (Add Inflow, Create Disbursement)
  // Recent movements table (last 20)
  // Balance trend chart (30 days)
  // Outstanding disbursements summary
  // Active alerts
}
```

#### 2. Disbursements Page (`/disbursements`)

```typescript
// app/(dashboard)/disbursements/page.tsx
// Renamed from /avances

export default function DisbursementsPage() {
  // Filters: status, intervenant, date range, category
  // Summary cards: total, justified, outstanding
  // Disbursements table
  // Create Disbursement button
  // Actions: Justify, Return to Cash
}
```

#### 3. Disbursement Detail Page (`/disbursements/[id]`)

```typescript
// app/(dashboard)/disbursements/[id]/page.tsx

export default function DisbursementDetailPage() {
  // Disbursement summary
  // Progress bar
  // Justifications history
  // Returns history
  // Add Justification button
  // Add Return button
}
```

### New Components

#### DisbursementCard

```typescript
interface DisbursementCardProps {
  disbursement: Disbursement;
  onJustify: (id: string) => void;
  onReturn: (id: string) => void;
}

export function DisbursementCard({ disbursement, onJustify, onReturn }: DisbursementCardProps) {
  // Display: intervenant, date, amount, remaining, status
  // Progress bar showing justified percentage
  // Days outstanding
  // Overdue indicator
  // Action buttons: Justify, Return
}
```

#### DisbursementForm

```typescript
interface DisbursementFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function DisbursementForm({ isOpen, onClose, onSuccess }: DisbursementFormProps) {
  // Fields: date, intervenant, amount, category, dueDate, note
  // Validation
  // Submit to POST /api/disbursements
}
```

#### JustificationForm

```typescript
interface JustificationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  disbursement: Disbursement;
}

export function JustificationForm({ isOpen, onClose, onSuccess, disbursement }: JustificationFormProps) {
  // Display disbursement details
  // Fields: date, amount, category, reference, note
  // Validation: amount <= remaining
  // Submit to POST /api/disbursements/[id]/justify
  // Note: Does NOT create cash movement
}
```

#### ReturnToCashForm

```typescript
interface ReturnToCashFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  disbursement: Disbursement;
}

export function ReturnToCashForm({ isOpen, onClose, onSuccess, disbursement }: ReturnToCashFormProps) {
  // Display disbursement details
  // Fields: date, amount, reference, note
  // Validation: amount <= remaining
  // Submit to POST /api/disbursements/[id]/return
  // Note: DOES create cash inflow movement
}
```

#### CashBalanceCard

```typescript
export function CashBalanceCard({ balance }: { balance: number }) {
  // Large, prominent display of current cash balance
  // Color coding: green if positive, red if negative
  // Last updated timestamp
  // Refresh button
}
```

#### QuickActionButtons

```typescript
export function QuickActionButtons({ onAddInflow, onCreateDisbursement }: QuickActionButtonsProps) {
  // Button: Add Cash Inflow
  // Button: Create Disbursement
  // Button: View All Movements
}
```

#### CashInflowForm

```typescript
interface CashInflowFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CashInflowForm({ isOpen, onClose, onSuccess }: CashInflowFormProps) {
  // Fields: date, amount, category, intervenant (optional), reference, note
  // Validation
  // Submit to POST /api/cash/inflow
}
```

## Business Logic

### Disbursement Calculations

```typescript
// lib/disbursement-calculations.ts

export function calculateDisbursementRemaining(disbursement: Disbursement): number {
  const totalJustified = disbursement.justifications?.reduce((sum, j) => sum + j.amount, 0) || 0;
  const totalReturned = disbursement.returns?.reduce((sum, r) => sum + r.amount, 0) || 0;
  return disbursement.initialAmount - totalJustified - totalReturned;
}

export function determineDisbursementStatus(disbursement: Disbursement): DisbursementStatus {
  const remaining = calculateDisbursementRemaining(disbursement);

  if (remaining === 0) return DisbursementStatus.JUSTIFIED;
  if (remaining < disbursement.initialAmount) return DisbursementStatus.PARTIALLY_JUSTIFIED;
  return DisbursementStatus.OPEN;
}

export function isDisbursementOverdue(disbursement: Disbursement): boolean {
  if (!disbursement.dueDate) return false;
  if (disbursement.status === DisbursementStatus.JUSTIFIED) return false;
  return new Date(disbursement.dueDate) < new Date();
}

export function getDaysOutstanding(disbursement: Disbursement): number {
  const now = new Date();
  const created = new Date(disbursement.createdAt);
  const diffTime = Math.abs(now.getTime() - created.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}
```

### Cash Balance Calculations

```typescript
// lib/cash-calculations.ts

export async function calculateCurrentCashBalance(prisma: PrismaClient, tenantId: string): Promise<number> {
  // Get all cash movements (modality = ESPECES)
  const movements = await prisma.mouvement.findMany({
    where: {
      tenantId,
      modality: "ESPECES",
    },
  });

  const inflows = movements.filter((m) => m.type === MouvementType.ENTREE).reduce((sum, m) => sum + m.amount, 0);

  const outflows = movements.filter((m) => m.type === MouvementType.SORTIE).reduce((sum, m) => sum + m.amount, 0);

  return inflows - outflows;
}

export async function calculateCashBalanceTrend(
  prisma: PrismaClient,
  tenantId: string,
  days: number = 30
): Promise<{ date: string; balance: number }[]> {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get all movements in date range
  const movements = await prisma.mouvement.findMany({
    where: {
      tenantId,
      modality: "ESPECES",
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    orderBy: { date: "asc" },
  });

  // Calculate running balance for each day
  const trend: { date: string; balance: number }[] = [];
  let runningBalance = 0;

  // Group by date and calculate
  const groupedByDate = movements.reduce((acc, m) => {
    const dateKey = m.date.toISOString().split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(m);
    return acc;
  }, {} as Record<string, typeof movements>);

  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const dateKey = date.toISOString().split("T")[0];

    const dayMovements = groupedByDate[dateKey] || [];
    const dayInflows = dayMovements
      .filter((m) => m.type === MouvementType.ENTREE)
      .reduce((sum, m) => sum + m.amount, 0);
    const dayOutflows = dayMovements
      .filter((m) => m.type === MouvementType.SORTIE)
      .reduce((sum, m) => sum + m.amount, 0);

    runningBalance += dayInflows - dayOutflows;
    trend.push({ date: dateKey, balance: runningBalance });
  }

  return trend;
}

export async function getTodayCashSummary(prisma: PrismaClient, tenantId: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const movements = await prisma.mouvement.findMany({
    where: {
      tenantId,
      modality: "ESPECES",
      date: { gte: today },
    },
  });

  const inflows = movements.filter((m) => m.type === MouvementType.ENTREE).reduce((sum, m) => sum + m.amount, 0);

  const outflows = movements.filter((m) => m.type === MouvementType.SORTIE).reduce((sum, m) => sum + m.amount, 0);

  return {
    inflows,
    outflows,
    net: inflows - outflows,
    count: movements.length,
  };
}
```

## Migration Strategy

### Phase 1: Database Migration

```typescript
// prisma/migrations/xxx_refactor_advance_to_disbursement.sql

-- Step 1: Create new Justification table
CREATE TABLE "Justification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "disbursementId" TEXT NOT NULL,
  "date" DATETIME NOT NULL,
  "amount" REAL NOT NULL,
  "category" TEXT NOT NULL,
  "reference" TEXT,
  "note" TEXT,
  "attachments" TEXT,
  "createdBy" TEXT NOT NULL,
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL
);

-- Step 2: Rename Advance table to Disbursement
ALTER TABLE "Advance" RENAME TO "Disbursement";

-- Step 3: Add new columns to Disbursement
ALTER TABLE "Disbursement" ADD COLUMN "initialAmount" REAL;
ALTER TABLE "Disbursement" ADD COLUMN "remainingAmount" REAL;
ALTER TABLE "Disbursement" ADD COLUMN "category" TEXT;

-- Step 4: Populate initialAmount from amount
UPDATE "Disbursement" SET "initialAmount" = "amount";

-- Step 5: Calculate remainingAmount from reimbursements
-- This will be done in application code for accuracy

-- Step 6: Rename status values
UPDATE "Disbursement" SET "status" = 'OPEN' WHERE "status" = 'EN_COURS';
UPDATE "Disbursement" SET "status" = 'PARTIALLY_JUSTIFIED' WHERE "status" = 'REMBOURSE_PARTIEL';
UPDATE "Disbursement" SET "status" = 'JUSTIFIED' WHERE "status" = 'REMBOURSE_TOTAL';

-- Step 7: Update Mouvement table
ALTER TABLE "Mouvement" RENAME COLUMN "isAdvance" TO "isDisbursement";
ALTER TABLE "Mouvement" RENAME COLUMN "advanceId" TO "disbursementId";

-- Step 8: Create indexes
CREATE INDEX "Justification_tenantId_idx" ON "Justification"("tenantId");
CREATE INDEX "Justification_disbursementId_idx" ON "Justification"("disbursementId");
CREATE INDEX "Justification_date_idx" ON "Justification"("date");
```

### Phase 2: Data Migration Script

```typescript
// scripts/migrate-advances-to-disbursements.ts

async function migrateAdvancesToDisbursements() {
  const disbursements = await prisma.disbursement.findMany({
    include: {
      reimbursements: true,
    },
  });

  for (const disbursement of disbursements) {
    // Calculate remaining amount
    const totalReimbursed = disbursement.reimbursements.reduce((sum, r) => sum + r.amount, 0);
    const remainingAmount = disbursement.initialAmount - totalReimbursed;

    // Update disbursement
    await prisma.disbursement.update({
      where: { id: disbursement.id },
      data: {
        remainingAmount,
        category: "SALARY_ADVANCE", // Default category
      },
    });

    // Note: Reimbursements stay as movements for now
    // Future: Convert some to justifications based on business rules
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// lib/disbursement-calculations.test.ts

describe("calculateDisbursementRemaining", () => {
  it("should calculate remaining with justifications only", () => {
    const disbursement = {
      initialAmount: 1000,
      justifications: [{ amount: 300 }, { amount: 200 }],
      returns: [],
    };
    expect(calculateDisbursementRemaining(disbursement)).toBe(500);
  });

  it("should calculate remaining with returns only", () => {
    const disbursement = {
      initialAmount: 1000,
      justifications: [],
      returns: [{ amount: 400 }],
    };
    expect(calculateDisbursementRemaining(disbursement)).toBe(600);
  });

  it("should calculate remaining with both justifications and returns", () => {
    const disbursement = {
      initialAmount: 1000,
      justifications: [{ amount: 300 }],
      returns: [{ amount: 400 }],
    };
    expect(calculateDisbursementRemaining(disbursement)).toBe(300);
  });
});

describe("determineDisbursementStatus", () => {
  it("should return JUSTIFIED when remaining is zero", () => {
    const disbursement = {
      initialAmount: 1000,
      justifications: [{ amount: 1000 }],
      returns: [],
    };
    expect(determineDisbursementStatus(disbursement)).toBe(DisbursementStatus.JUSTIFIED);
  });

  it("should return PARTIALLY_JUSTIFIED when partially used", () => {
    const disbursement = {
      initialAmount: 1000,
      justifications: [{ amount: 500 }],
      returns: [],
    };
    expect(determineDisbursementStatus(disbursement)).toBe(DisbursementStatus.PARTIALLY_JUSTIFIED);
  });

  it("should return OPEN when nothing justified or returned", () => {
    const disbursement = {
      initialAmount: 1000,
      justifications: [],
      returns: [],
    };
    expect(determineDisbursementStatus(disbursement)).toBe(DisbursementStatus.OPEN);
  });
});
```

### Integration Tests

- Test POST /api/disbursements creates both disbursement and movement
- Test POST /api/disbursements/[id]/justify does NOT create movement
- Test POST /api/disbursements/[id]/return creates movement
- Test GET /api/cash/dashboard returns correct balance
- Test cash balance calculation with mixed movements

## UI/UX Considerations

### Navigation Updates

```typescript
// Update navigation menu
const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon }, // NEW
  { name: "Mouvements", href: "/mouvements", icon: ArrowsRightLeftIcon },
  { name: "Décaissements", href: "/disbursements", icon: BanknoteIcon }, // Renamed from Avances
  { name: "Soldes", href: "/soldes", icon: ScaleIcon },
  { name: "Intervenants", href: "/intervenants", icon: UsersIcon },
  { name: "Catégories", href: "/categories", icon: TagIcon },
  { name: "Utilisateurs", href: "/utilisateurs", icon: UserGroupIcon },
];
```

### Color Coding

- **Disbursement Status:**

  - OPEN: Yellow/Orange
  - PARTIALLY_JUSTIFIED: Blue
  - JUSTIFIED: Green
  - Overdue: Red border/background

- **Cash Balance:**
  - Positive: Green
  - Negative: Red
  - Near zero: Yellow

### Key Differences to Highlight in UI

- **Justification Form:** Clear message "This does NOT create a cash movement"
- **Return Form:** Clear message "This WILL create a cash inflow"
- **Disbursement Detail:** Separate sections for "Justifications" and "Returns to Cash"

## Performance Considerations

1. **Caching:** Cache current cash balance with 5-minute TTL
2. **Indexing:** Ensure proper indexes on disbursementId, tenantId, date
3. **Pagination:** Implement pagination for disbursement lists
4. **Lazy Loading:** Load justifications/returns on demand
5. **Background Jobs:** Calculate balance trends asynchronously

## Security Considerations

- All endpoints require authentication
- Tenant isolation enforced at database query level
- Admin role required for create/justify/return operations
- Audit logging for all disbursement operations
- Rate limiting on disbursement creation

## Deployment Notes

### Migration Checklist

1. ✅ Backup database
2. ✅ Run Prisma migration
3. ✅ Run data migration script
4. ✅ Update environment variables
5. ✅ Deploy backend changes
6. ✅ Deploy frontend changes
7. ✅ Update navigation/routing
8. ✅ Test critical paths
9. ✅ Monitor for errors
10. ✅ Communicate changes to users
