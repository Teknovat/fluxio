# Design Document - Fluxio Enhancements

## Overview

This design document details the technical implementation of enhancements to the Fluxio cash management system. The enhancements focus on six main areas: intervenant balance tracking, cash reconciliation, movement categorization, advance management, alerts system, and reporting capabilities.

## Architecture

### Enhanced Database Schema

```prisma
// Additional models and enums

enum MovementCategory {
  SALAIRES
  ACHATS_STOCK
  FRAIS_GENERAUX
  AVANCES_ASSOCIES
  VENTES
  CHARGES_FIXES
  AUTRES
}

enum AdvanceStatus {
  EN_COURS
  REMBOURSE_PARTIEL
  REMBOURSE_TOTAL
}

enum AlertType {
  DEBT_THRESHOLD
  LOW_CASH
  OVERDUE_ADVANCE
  RECONCILIATION_GAP
}

model Mouvement {
  // ... existing fields ...
  category      MovementCategory?
  isAdvance     Boolean           @default(false)
  advanceId     String?
  advance       Advance?          @relation("AdvanceReimbursements", fields: [advanceId], references: [id])
  linkedAdvance Advance?          @relation("AdvanceMovement")
}

model Advance {
  id              String         @id @default(cuid())
  mouvementId     String         @unique
  mouvement       Mouvement      @relation("AdvanceMovement", fields: [mouvementId], references: [id])
  intervenantId   String
  intervenant     Intervenant    @relation(fields: [intervenantId], references: [id])
  amount          Float
  dueDate         DateTime?
  status          AdvanceStatus  @default(EN_COURS)
  reimbursements  Mouvement[]    @relation("AdvanceReimbursements")
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  @@index([intervenantId])
  @@index([status])
  @@index([dueDate])
}

model CashReconciliation {
  id                String   @id @default(cuid())
  date              DateTime
  theoreticalBalance Float
  physicalCount     Float
  gap               Float
  note              String?
  userId            String
  user              User     @relation(fields: [userId], references: [id])
  createdAt         DateTime @default(now())

  @@index([date])
}

model Alert {
  id          String    @id @default(cuid())
  type        AlertType
  title       String
  message     String
  severity    String    // INFO, WARNING, ERROR
  relatedId   String?   // ID of related entity (intervenant, advance, etc.)
  dismissed   Boolean   @default(false)
  dismissedAt DateTime?
  dismissedBy String?
  createdAt   DateTime  @default(now())

  @@index([dismissed])
  @@index([type])
  @@index([createdAt])
}

model Settings {
  id                      String  @id @default("default")
  debtThreshold           Float   @default(10000)
  minCashBalance          Float   @default(5000)
  reconciliationGapThreshold Float @default(500)
  defaultAdvanceDueDays   Int     @default(30)
  companyName             String  @default("Fluxio")
  companyLogo             String?
  currency                String  @default("TND")
  alertsEnabled           Boolean @default(true)
  categoriesEnabled       Boolean @default(true)
  advancesEnabled         Boolean @default(true)
  updatedAt               DateTime @updatedAt
}

// Add relation to Intervenant
model Intervenant {
  // ... existing fields ...
  advances    Advance[]
  notes       String?
}

// Add relation to User
model User {
  // ... existing fields ...
  reconciliations CashReconciliation[]
}
```

### New API Endpoints

#### Balance Endpoints

**GET /api/balances**

- Query params: `?type=ASSOCIE&dateFrom=2024-01-01&dateTo=2024-12-31`
- Response: `{ balances: IntervenantBalance[], summary: BalanceSummary }`

```typescript
interface IntervenantBalance {
  intervenant: Intervenant;
  totalEntries: number;
  totalExits: number;
  balance: number;
  movementCount: number;
  lastMovementDate: Date;
}

interface BalanceSummary {
  totalOwedToCompany: number;
  totalCompanyOwes: number;
  netBalance: number;
}
```

**GET /api/balances/[intervenantId]**

- Response: `{ balance: IntervenantBalance, movements: Mouvement[], advances: Advance[] }`

#### Cash Reconciliation Endpoints

**GET /api/reconciliations**

- Query params: `?dateFrom=2024-01-01&dateTo=2024-12-31`
- Response: `CashReconciliation[]`

**POST /api/reconciliations**

- Request: `{ date: string, physicalCount: number, note?: string }`
- Response: `CashReconciliation`
- Calculates theoretical balance automatically

**GET /api/reconciliations/current-balance**

- Response: `{ theoreticalBalance: number, lastReconciliation: CashReconciliation | null }`

#### Category Endpoints

**GET /api/reports/categories**

- Query params: `?dateFrom=2024-01-01&dateTo=2024-12-31&type=SORTIE`
- Response: `{ categories: CategorySummary[], total: number }`

```typescript
interface CategorySummary {
  category: MovementCategory;
  amount: number;
  count: number;
  percentage: number;
}
```

#### Advance Endpoints

**GET /api/advances**

- Query params: `?status=EN_COURS&intervenantId=xxx`
- Response: `Advance[]` with reimbursements included

**POST /api/advances**

- Request: `{ date: string, intervenantId: string, amount: number, dueDate?: string, note?: string }`
- Response: `Advance`
- Creates both Advance and associated Mouvement

**POST /api/advances/[id]/reimburse**

- Request: `{ date: string, amount: number, reference?: string, note?: string }`
- Response: `{ advance: Advance, reimbursement: Mouvement }`
- Creates reimbursement movement and updates advance status

**GET /api/advances/summary**

- Response: `{ totalAdvances: number, totalReimbursed: number, totalOutstanding: number }`

#### Alert Endpoints

**GET /api/alerts**

- Query params: `?dismissed=false`
- Response: `Alert[]`

**POST /api/alerts/check**

- Triggers alert checking logic
- Response: `{ alertsCreated: number }`

**PATCH /api/alerts/[id]/dismiss**

- Response: `Alert`

#### Settings Endpoints

**GET /api/settings**

- Response: `Settings`

**PATCH /api/settings**

- Request: `Partial<Settings>`
- Response: `Settings`

#### Report Endpoints

**GET /api/reports/dashboard**

- Response: `DashboardData`

```typescript
interface DashboardData {
  currentBalance: number;
  totalOutstandingDebts: number;
  totalAdvances: number;
  monthlyChange: number;
  recentMovements: Mouvement[];
  topDebtors: IntervenantBalance[];
  alerts: Alert[];
  balanceTrend: { date: string; balance: number }[];
  todayMovements: { count: number; total: number };
}
```

**GET /api/reports/export/movements**

- Query params: filters
- Response: Excel file download

**GET /api/reports/export/balances**

- Response: Excel file download

**GET /api/reports/export/intervenant/[id]**

- Response: PDF file download

## Components and Interfaces

### New Pages

#### 1. Dashboard Page (`/dashboard`)

```typescript
// app/(dashboard)/page.tsx

export default function DashboardPage() {
  // Summary cards
  // Recent movements
  // Top debtors
  // Alerts
  // Balance trend chart
  // Quick actions
}
```

#### 2. Balances Page (`/soldes`)

```typescript
// app/(dashboard)/soldes/page.tsx

export default function SoldesPage() {
  // Filters: type, date range
  // Summary cards
  // Balances table with sorting
  // Click to view intervenant details
}
```

#### 3. Intervenant Detail Page (`/intervenants/[id]`)

```typescript
// app/(dashboard)/intervenants/[id]/page.tsx

export default function IntervenantDetailPage() {
  // Summary statistics
  // Balance evolution chart
  // Movements timeline
  // Outstanding advances
  // Export button
}
```

#### 4. Cash Reconciliation Page (`/rapprochement`)

```typescript
// app/(dashboard)/rapprochement/page.tsx

export default function RapprochementPage() {
  // Current theoretical balance
  // Physical count input
  // Gap calculation
  // Save reconciliation
  // Reconciliation history
  // Gap trend chart
}
```

#### 5. Advances Page (`/avances`)

```typescript
// app/(dashboard)/avances/page.tsx

export default function AvancesPage() {
  // Filters: status, intervenant, date range
  // Summary cards
  // Advances table
  // Add advance button
  // Reimburse button per advance
}
```

#### 6. Categories Report Page (`/rapports/categories`)

```typescript
// app/(dashboard)/rapports/categories/page.tsx

export default function CategoriesReportPage() {
  // Date range filter
  // Type filter (ENTREE/SORTIE)
  // Category summary table
  // Pie chart
  // Bar chart (monthly comparison)
  // Export button
}
```

#### 7. Settings Page (`/parametres`)

```typescript
// app/(dashboard)/parametres/page.tsx

export default function ParametresPage() {
  // Alert thresholds
  // Advance settings
  // Company information
  // Currency settings
  // Feature toggles
  // Save button
}
```

### New Components

#### BalanceCard Component

```typescript
interface BalanceCardProps {
  intervenant: Intervenant;
  balance: number;
  totalEntries: number;
  totalExits: number;
  onClick: () => void;
}

export function BalanceCard({ intervenant, balance, totalEntries, totalExits, onClick }: BalanceCardProps) {
  const balanceColor = balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : "text-gray-600";

  return (
    <div onClick={onClick} className="cursor-pointer hover:bg-gray-50 p-4 border rounded">
      <h3>{intervenant.name}</h3>
      <div className={balanceColor}>{formatAmount(Math.abs(balance))}</div>
      <div className="text-sm text-gray-500">
        Entrées: {formatAmount(totalEntries)} | Sorties: {formatAmount(totalExits)}
      </div>
    </div>
  );
}
```

#### AlertBanner Component

```typescript
interface AlertBannerProps {
  alerts: Alert[];
  onDismiss: (id: string) => void;
  onViewAll: () => void;
}

export function AlertBanner({ alerts, onDismiss, onViewAll }: AlertBannerProps) {
  if (alerts.length === 0) return null;

  return (
    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-semibold">Alertes ({alerts.length})</h3>
          {alerts.slice(0, 3).map((alert) => (
            <div key={alert.id} className="mt-2">
              <p className="font-medium">{alert.title}</p>
              <p className="text-sm text-gray-600">{alert.message}</p>
              <button onClick={() => onDismiss(alert.id)}>Ignorer</button>
            </div>
          ))}
        </div>
        <button onClick={onViewAll}>Voir tout</button>
      </div>
    </div>
  );
}
```

#### AdvanceCard Component

```typescript
interface AdvanceCardProps {
  advance: Advance;
  onReimburse: (id: string) => void;
}

export function AdvanceCard({ advance, onReimburse }: AdvanceCardProps) {
  const remaining = advance.amount - advance.reimbursements.reduce((sum, r) => sum + r.amount, 0);
  const progress = ((advance.amount - remaining) / advance.amount) * 100;
  const isOverdue = advance.dueDate && new Date(advance.dueDate) < new Date();

  return (
    <div className={`p-4 border rounded ${isOverdue ? "border-red-500" : ""}`}>
      <div className="flex justify-between">
        <div>
          <h4>{advance.intervenant.name}</h4>
          <p>Montant: {formatAmount(advance.amount)}</p>
          <p>Restant: {formatAmount(remaining)}</p>
        </div>
        <button onClick={() => onReimburse(advance.id)}>Rembourser</button>
      </div>
      <div className="mt-2">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
```

#### ChartComponents

```typescript
// Using recharts library

import { LineChart, Line, BarChart, Bar, PieChart, Pie, XAxis, YAxis, Tooltip, Legend } from "recharts";

export function BalanceTrendChart({ data }: { data: { date: string; balance: number }[] }) {
  return (
    <LineChart width={600} height={300} data={data}>
      <XAxis dataKey="date" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Line type="monotone" dataKey="balance" stroke="#3b82f6" />
    </LineChart>
  );
}

export function CategoryPieChart({ data }: { data: CategorySummary[] }) {
  return (
    <PieChart width={400} height={400}>
      <Pie data={data} dataKey="amount" nameKey="category" cx="50%" cy="50%" outerRadius={80} fill="#8884d8" label />
      <Tooltip />
    </PieChart>
  );
}

export function MonthlyComparisonChart({ data }: { data: { month: string; entrees: number; sorties: number }[] }) {
  return (
    <BarChart width={600} height={300} data={data}>
      <XAxis dataKey="month" />
      <YAxis />
      <Tooltip />
      <Legend />
      <Bar dataKey="entrees" fill="#10b981" />
      <Bar dataKey="sorties" fill="#ef4444" />
    </BarChart>
  );
}
```

## Data Models

### TypeScript Interfaces

```typescript
// types/index.ts - additions

export enum MovementCategory {
  SALAIRES = "SALAIRES",
  ACHATS_STOCK = "ACHATS_STOCK",
  FRAIS_GENERAUX = "FRAIS_GENERAUX",
  AVANCES_ASSOCIES = "AVANCES_ASSOCIES",
  VENTES = "VENTES",
  CHARGES_FIXES = "CHARGES_FIXES",
  AUTRES = "AUTRES",
}

export enum AdvanceStatus {
  EN_COURS = "EN_COURS",
  REMBOURSE_PARTIEL = "REMBOURSE_PARTIEL",
  REMBOURSE_TOTAL = "REMBOURSE_TOTAL",
}

export enum AlertType {
  DEBT_THRESHOLD = "DEBT_THRESHOLD",
  LOW_CASH = "LOW_CASH",
  OVERDUE_ADVANCE = "OVERDUE_ADVANCE",
  RECONCILIATION_GAP = "RECONCILIATION_GAP",
}

export interface Advance {
  id: string;
  mouvementId: string;
  mouvement: Mouvement;
  intervenantId: string;
  intervenant: Intervenant;
  amount: number;
  dueDate?: Date;
  status: AdvanceStatus;
  reimbursements: Mouvement[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CashReconciliation {
  id: string;
  date: Date;
  theoreticalBalance: number;
  physicalCount: number;
  gap: number;
  note?: string;
  userId: string;
  user: User;
  createdAt: Date;
}

export interface Alert {
  id: string;
  type: AlertType;
  title: string;
  message: string;
  severity: "INFO" | "WARNING" | "ERROR";
  relatedId?: string;
  dismissed: boolean;
  dismissedAt?: Date;
  dismissedBy?: string;
  createdAt: Date;
}

export interface Settings {
  id: string;
  debtThreshold: number;
  minCashBalance: number;
  reconciliationGapThreshold: number;
  defaultAdvanceDueDays: number;
  companyName: string;
  companyLogo?: string;
  currency: string;
  alertsEnabled: boolean;
  categoriesEnabled: boolean;
  advancesEnabled: boolean;
  updatedAt: Date;
}

export interface IntervenantBalance {
  intervenant: Intervenant;
  totalEntries: number;
  totalExits: number;
  balance: number;
  movementCount: number;
  lastMovementDate?: Date;
}

export interface BalanceSummary {
  totalOwedToCompany: number;
  totalCompanyOwes: number;
  netBalance: number;
}

export interface CategorySummary {
  category: MovementCategory;
  amount: number;
  count: number;
  percentage: number;
}

export interface DashboardData {
  currentBalance: number;
  totalOutstandingDebts: number;
  totalAdvances: number;
  monthlyChange: number;
  recentMovements: Mouvement[];
  topDebtors: IntervenantBalance[];
  alerts: Alert[];
  balanceTrend: { date: string; balance: number }[];
  todayMovements: { count: number; total: number };
}
```

## Business Logic

### Balance Calculation

```typescript
// lib/calculations.ts

export function calculateIntervenantBalance(movements: Mouvement[]): number {
  const totalExits = movements.filter((m) => m.type === "SORTIE").reduce((sum, m) => sum + m.amount, 0);

  const totalEntries = movements.filter((m) => m.type === "ENTREE").reduce((sum, m) => sum + m.amount, 0);

  // Positive balance = intervenant owes company
  // Negative balance = company owes intervenant
  return totalExits - totalEntries;
}

export function calculateTheoreticalCashBalance(movements: Mouvement[]): number {
  const cashMovements = movements.filter((m) => m.modality === "ESPECES");

  const entries = cashMovements.filter((m) => m.type === "ENTREE").reduce((sum, m) => sum + m.amount, 0);

  const exits = cashMovements.filter((m) => m.type === "SORTIE").reduce((sum, m) => sum + m.amount, 0);

  return entries - exits;
}

export function calculateAdvanceRemaining(advance: Advance): number {
  const totalReimbursed = advance.reimbursements.reduce((sum, r) => sum + r.amount, 0);
  return advance.amount - totalReimbursed;
}

export function determineAdvanceStatus(advance: Advance): AdvanceStatus {
  const remaining = calculateAdvanceRemaining(advance);

  if (remaining === 0) return AdvanceStatus.REMBOURSE_TOTAL;
  if (remaining < advance.amount) return AdvanceStatus.REMBOURSE_PARTIEL;
  return AdvanceStatus.EN_COURS;
}
```

### Alert Generation

```typescript
// lib/alerts.ts

export async function checkAndCreateAlerts(prisma: PrismaClient, settings: Settings): Promise<Alert[]> {
  const alerts: Alert[] = [];

  if (!settings.alertsEnabled) return alerts;

  // Check debt thresholds
  const balances = await calculateAllBalances(prisma);
  for (const balance of balances) {
    if (balance.balance > settings.debtThreshold) {
      alerts.push({
        type: AlertType.DEBT_THRESHOLD,
        title: `Dette élevée: ${balance.intervenant.name}`,
        message: `${balance.intervenant.name} doit ${formatAmount(balance.balance)} à la société`,
        severity: "WARNING",
        relatedId: balance.intervenant.id,
      });
    }
  }

  // Check low cash
  const cashBalance = await calculateTheoreticalCashBalance(prisma);
  if (cashBalance < settings.minCashBalance) {
    alerts.push({
      type: AlertType.LOW_CASH,
      title: "Caisse faible",
      message: `Le solde de caisse (${formatAmount(cashBalance)}) est en dessous du minimum (${formatAmount(
        settings.minCashBalance
      )})`,
      severity: "ERROR",
    });
  }

  // Check overdue advances
  const overdueAdvances = await prisma.advance.findMany({
    where: {
      status: { not: AdvanceStatus.REMBOURSE_TOTAL },
      dueDate: { lt: new Date() },
    },
    include: { intervenant: true },
  });

  for (const advance of overdueAdvances) {
    alerts.push({
      type: AlertType.OVERDUE_ADVANCE,
      title: `Avance en retard: ${advance.intervenant.name}`,
      message: `Avance de ${formatAmount(advance.amount)} en retard depuis le ${formatDate(advance.dueDate)}`,
      severity: "WARNING",
      relatedId: advance.id,
    });
  }

  return alerts;
}
```

### Export Functions

```typescript
// lib/export.ts

import ExcelJS from "exceljs";
import PDFDocument from "pdfkit";

export async function exportMovementsToExcel(movements: Mouvement[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Mouvements");

  worksheet.columns = [
    { header: "Date", key: "date", width: 12 },
    { header: "Intervenant", key: "intervenant", width: 20 },
    { header: "Type", key: "type", width: 10 },
    { header: "Montant", key: "amount", width: 15 },
    { header: "Référence", key: "reference", width: 15 },
    { header: "Modalité", key: "modality", width: 12 },
    { header: "Catégorie", key: "category", width: 15 },
    { header: "Note", key: "note", width: 30 },
  ];

  movements.forEach((m) => {
    worksheet.addRow({
      date: formatDate(m.date),
      intervenant: m.intervenant?.name,
      type: m.type,
      amount: m.amount,
      reference: m.reference,
      modality: m.modality,
      category: m.category,
      note: m.note,
    });
  });

  return await workbook.xlsx.writeBuffer();
}

export async function exportIntervenantToPDF(
  intervenant: Intervenant,
  balance: IntervenantBalance,
  movements: Mouvement[]
): Promise<Buffer> {
  const doc = new PDFDocument();
  const buffers: Buffer[] = [];

  doc.on("data", buffers.push.bind(buffers));

  // Header
  doc.fontSize(20).text("Relevé de Compte", { align: "center" });
  doc.fontSize(12).text(`Intervenant: ${intervenant.name}`);
  doc.text(`Type: ${intervenant.type}`);
  doc.text(`Date: ${formatDate(new Date())}`);

  // Summary
  doc.moveDown();
  doc.fontSize(14).text("Résumé");
  doc.fontSize(10);
  doc.text(`Total Entrées: ${formatAmount(balance.totalEntries)}`);
  doc.text(`Total Sorties: ${formatAmount(balance.totalExits)}`);
  doc.text(`Solde: ${formatAmount(balance.balance)}`);

  // Movements table
  doc.moveDown();
  doc.fontSize(14).text("Mouvements");
  // ... add table with movements

  doc.end();

  return Buffer.concat(buffers);
}
```

## Error Handling

All new API endpoints follow the same error handling strategy as existing endpoints:

- 400 for validation errors
- 401 for authentication errors
- 403 for authorization errors
- 404 for not found
- 409 for conflicts
- 500 for server errors

## Testing Strategy

### Unit Tests

- Balance calculation functions
- Alert generation logic
- Advance status determination
- Export functions

### Integration Tests

- All new API endpoints
- Alert checking cron job
- Export generation

### Property-Based Tests

Property tests will be added for critical calculations to ensure correctness across all inputs.

## UI/UX Considerations

### Navigation Updates

Add new menu items:

- Dashboard (home icon)
- Soldes (balance scale icon)
- Avances (money icon)
- Rapprochement (calculator icon)
- Rapports (chart icon)
- Paramètres (gear icon, admin only)

### Color Coding

- Red: Debt, negative situations, alerts
- Green: Credit, positive situations, success
- Blue: Neutral information
- Yellow: Warnings, pending items
- Gray: Inactive, zero balance

### Responsive Design

All new pages follow mobile-first design with:

- Collapsible filters on mobile
- Card-based layouts for tables on small screens
- Touch-friendly buttons
- Swipe gestures for actions

## Performance Considerations

1. **Caching**: Cache settings, alert counts, dashboard data
2. **Indexing**: Database indexes on frequently queried fields
3. **Pagination**: Implement pagination for large datasets
4. **Lazy Loading**: Load charts and heavy components on demand
5. **Background Jobs**: Run alert checking as background job

## Security Considerations

- All new endpoints require authentication
- Admin-only endpoints enforce role check
- Sensitive data (balances, advances) only accessible to authorized users
- Export functions include user audit trail
- Settings changes logged

## Deployment Notes

### Database Migration

Run Prisma migrations to add new tables and fields:

```bash
npx prisma migrate dev --name add-enhancements
```

### Environment Variables

Add new optional variables:

```env
ALERT_CHECK_INTERVAL=300000  # 5 minutes
ENABLE_AUTO_ALERTS=true
```

### Dependencies

Add new packages:

```json
{
  "exceljs": "^4.3.0",
  "pdfkit": "^0.13.0",
  "recharts": "^2.10.0"
}
```

## Future Enhancements

- Email notifications for alerts
- SMS notifications for critical alerts
- Mobile app
- Barcode scanning for stock movements
- Integration with accounting software
- Multi-user collaboration features
- Advanced analytics with AI insights
