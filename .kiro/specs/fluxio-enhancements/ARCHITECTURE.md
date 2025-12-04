# Architecture des Améliorations Fluxio

## Vue d'Ensemble du Système

```
┌─────────────────────────────────────────────────────────────────┐
│                         FLUXIO ENHANCED                          │
│                    Cash Management System                        │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │  Dashboard   │  │   Soldes     │  │  Avances     │         │
│  │     (/)      │  │  (/soldes)   │  │ (/avances)   │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │Rapprochement │  │  Rapports    │  │  Paramètres  │         │
│  │(/rapproche.) │  │ (/rapports)  │  │(/parametres) │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ Mouvements   │  │Intervenants  │  │ Utilisateurs │         │
│  │(/mouvements) │  │(/intervenants│  │(/utilisateurs│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         API LAYER                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  /api/balances              - Soldes par intervenant            │
│  /api/balances/[id]         - Détail intervenant                │
│  /api/reconciliations       - Rapprochements de caisse          │
│  /api/advances              - Gestion des avances               │
│  /api/advances/[id]/reimburse - Remboursements                  │
│  /api/alerts                - Système d'alertes                 │
│  /api/settings              - Configuration                     │
│  /api/reports/dashboard     - Données dashboard                 │
│  /api/reports/categories    - Rapports par catégorie            │
│  /api/reports/export/*      - Exports Excel/PDF                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      BUSINESS LOGIC                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  lib/calculations.ts        - Calculs de soldes et balances     │
│  lib/alerts.ts              - Génération d'alertes              │
│  lib/export.ts              - Export Excel/PDF                  │
│  lib/auth.ts                - Authentification JWT              │
│  lib/validations.ts         - Validation Zod                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER (Prisma)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  User                       - Utilisateurs du système            │
│  Intervenant                - Clients, fournisseurs, associés   │
│  Mouvement                  - Transactions (entrées/sorties)    │
│  Advance                    - Avances données                   │
│  CashReconciliation         - Rapprochements de caisse          │
│  Alert                      - Alertes système                   │
│  Settings                   - Configuration                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATABASE (SQLite)                           │
└─────────────────────────────────────────────────────────────────┘
```

## Flux de Données Principaux

### 1. Calcul des Soldes par Intervenant

```
┌──────────────┐
│   Client     │
│  (Browser)   │
└──────┬───────┘
       │ GET /api/balances?type=ASSOCIE
       ▼
┌──────────────────────────────────────┐
│  API Route: /api/balances            │
│  - Authentification                  │
│  - Récupération des mouvements       │
│  - Appel calculateIntervenantBalance │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  lib/calculations.ts                 │
│  calculateIntervenantBalance()       │
│  - Somme SORTIE (argent donné)       │
│  - Somme ENTREE (argent rendu)       │
│  - Balance = SORTIE - ENTREE         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Prisma ORM                          │
│  - Query mouvements par intervenant  │
│  - Include intervenant data          │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  SQLite Database                     │
│  - Table: Mouvement                  │
│  - Table: Intervenant                │
└──────┬───────────────────────────────┘
       │ Résultats
       ▼
┌──────────────────────────────────────┐
│  Response JSON                       │
│  {                                   │
│    balances: [                       │
│      {                               │
│        intervenant: {...},           │
│        totalEntries: 50000,          │
│        totalExits: 75000,            │
│        balance: 25000 (DETTE)        │
│      }                               │
│    ],                                │
│    summary: {                        │
│      totalOwedToCompany: 125000      │
│    }                                 │
│  }                                   │
└──────────────────────────────────────┘
```

### 2. Gestion des Avances

```
┌──────────────┐
│   Client     │
│  (Browser)   │
└──────┬───────┘
       │ POST /api/advances
       │ { intervenantId, amount, dueDate }
       ▼
┌──────────────────────────────────────┐
│  API Route: /api/advances            │
│  - Authentification Admin            │
│  - Validation des données            │
│  - Transaction DB                    │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Prisma Transaction                  │
│  1. Créer Mouvement (SORTIE)         │
│  2. Créer Advance lié au Mouvement   │
│  3. Commit transaction               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Database                            │
│  - INSERT INTO Mouvement             │
│  - INSERT INTO Advance               │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Response: Advance créée             │
│  {                                   │
│    id: "adv_123",                    │
│    amount: 50000,                    │
│    status: "EN_COURS",               │
│    dueDate: "2024-02-01"             │
│  }                                   │
└──────────────────────────────────────┘
```

### 3. Système d'Alertes

```
┌──────────────────────────────────────┐
│  Background Job (Every 5 min)        │
│  POST /api/alerts/check              │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  lib/alerts.ts                       │
│  checkAndCreateAlerts()              │
│  - Check debt thresholds             │
│  - Check low cash                    │
│  - Check overdue advances            │
│  - Check reconciliation gaps         │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Prisma                              │
│  - Query balances                    │
│  - Query cash balance                │
│  - Query overdue advances            │
│  - Query settings (thresholds)       │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  Create Alerts if conditions met     │
│  INSERT INTO Alert                   │
│  - type: DEBT_THRESHOLD              │
│  - severity: WARNING                 │
│  - message: "X doit Y à la société"  │
└──────┬───────────────────────────────┘
       │
       ▼
┌──────────────────────────────────────┐
│  UI Updates                          │
│  - Alert badge count                 │
│  - Alert banner on dashboard         │
│  - Notification (future)             │
└──────────────────────────────────────┘
```

## Modèle de Données Relationnel

```
┌─────────────────┐
│      User       │
│─────────────────│
│ id (PK)         │
│ name            │
│ email           │
│ password        │
│ role            │
│ active          │
└────────┬────────┘
         │
         │ 1:N
         │
         ▼
┌─────────────────────────┐
│  CashReconciliation     │
│─────────────────────────│
│ id (PK)                 │
│ userId (FK)             │
│ date                    │
│ theoreticalBalance      │
│ physicalCount           │
│ gap                     │
│ note                    │
└─────────────────────────┘


┌─────────────────┐
│  Intervenant    │
│─────────────────│
│ id (PK)         │
│ name            │
│ type            │
│ active          │
│ notes           │
└────────┬────────┘
         │
         │ 1:N
         ├──────────────────┐
         │                  │
         ▼                  ▼
┌─────────────────┐  ┌─────────────────┐
│   Mouvement     │  │    Advance      │
│─────────────────│  │─────────────────│
│ id (PK)         │  │ id (PK)         │
│ intervenantId(FK│  │ mouvementId (FK)│
│ date            │  │ intervenantId(FK│
│ type            │  │ amount          │
│ amount          │  │ dueDate         │
│ reference       │  │ status          │
│ modality        │  └────────┬────────┘
│ category        │           │
│ note            │           │ 1:N
│ isAdvance       │           │
│ advanceId (FK)  │◄──────────┘
└─────────────────┘    (reimbursements)


┌─────────────────┐
│     Alert       │
│─────────────────│
│ id (PK)         │
│ type            │
│ title           │
│ message         │
│ severity        │
│ relatedId       │
│ dismissed       │
│ dismissedAt     │
│ dismissedBy     │
└─────────────────┘


┌─────────────────┐
│    Settings     │
│─────────────────│
│ id (PK)         │
│ debtThreshold   │
│ minCashBalance  │
│ reconciliationGap│
│ defaultDueDays  │
│ companyName     │
│ currency        │
│ alertsEnabled   │
│ categoriesEnabled│
│ advancesEnabled │
└─────────────────┘
```

## Composants React Principaux

```
App Layout
│
├── Navigation
│   ├── Logo
│   ├── Menu Items (role-based)
│   ├── Alert Badge
│   └── User Menu
│
├── Dashboard Page (/)
│   ├── Summary Cards
│   │   ├── Current Balance
│   │   ├── Total Debts
│   │   ├── Total Advances
│   │   └── Monthly Change
│   ├── Alert Banner
│   ├── Recent Movements Table
│   ├── Top Debtors List
│   ├── Balance Trend Chart
│   └── Quick Actions
│
├── Soldes Page (/soldes)
│   ├── Filters
│   │   ├── Type Dropdown
│   │   └── Date Range
│   ├── Summary Cards
│   ├── Balances Table
│   │   └── Balance Card (per row)
│   └── Export Button
│
├── Intervenant Detail (/intervenants/[id])
│   ├── Summary Statistics
│   ├── Balance Evolution Chart
│   ├── Movements Timeline
│   ├── Outstanding Advances
│   └── Export Button
│
├── Avances Page (/avances)
│   ├── Filters
│   ├── Summary Cards
│   ├── Advances Table
│   │   └── Advance Card (per row)
│   ├── Add Advance Button
│   │   └── Advance Form Modal
│   └── Reimburse Button
│       └── Reimbursement Form Modal
│
├── Rapprochement Page (/rapprochement)
│   ├── Current Balance Display
│   ├── Physical Count Form
│   ├── Gap Display
│   ├── Save Button
│   ├── Reconciliation History
│   └── Gap Trend Chart
│
├── Categories Report (/rapports/categories)
│   ├── Filters
│   ├── Category Summary Table
│   ├── Category Pie Chart
│   ├── Monthly Comparison Chart
│   └── Export Button
│
└── Settings Page (/parametres)
    ├── Alert Thresholds Section
    ├── Advance Settings Section
    ├── Company Info Section
    ├── Currency Settings Section
    ├── Feature Toggles Section
    └── Save Button
```

## Sécurité et Permissions

```
┌─────────────────────────────────────────────────────────────┐
│                    PERMISSION MATRIX                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Feature              │  USER (Simple)  │  ADMIN            │
│  ────────────────────────────────────────────────────────── │
│  Dashboard            │  ✅ View        │  ✅ View          │
│  Soldes               │  ✅ View        │  ✅ View          │
│  Mouvements (View)    │  ✅ View        │  ✅ View          │
│  Mouvements (Create)  │  ✅ Create      │  ✅ Create        │
│  Mouvements (Edit)    │  ❌ No          │  ✅ Edit          │
│  Mouvements (Delete)  │  ❌ No          │  ✅ Delete        │
│  Avances (View)       │  ✅ View        │  ✅ View          │
│  Avances (Create)     │  ❌ No          │  ✅ Create        │
│  Avances (Reimburse)  │  ❌ No          │  ✅ Reimburse     │
│  Rapprochement        │  ✅ View        │  ✅ View + Create │
│  Rapports             │  ✅ View        │  ✅ View + Export │
│  Intervenants         │  ❌ No          │  ✅ Full Access   │
│  Utilisateurs         │  ❌ No          │  ✅ Full Access   │
│  Paramètres           │  ❌ No          │  ✅ Full Access   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Performance et Optimisation

### Stratégies de Cache

```
┌─────────────────────────────────────────┐
│  Cache Strategy                         │
├─────────────────────────────────────────┤
│                                         │
│  Settings                               │
│  └─ Cache: 5 minutes                    │
│  └─ Invalidate: On update               │
│                                         │
│  Alert Count                            │
│  └─ Cache: 1 minute                     │
│  └─ Invalidate: On alert check          │
│                                         │
│  Dashboard Data                         │
│  └─ Cache: 2 minutes                    │
│  └─ Invalidate: On movement create      │
│                                         │
│  Intervenant List                       │
│  └─ Cache: 10 minutes                   │
│  └─ Invalidate: On intervenant update   │
│                                         │
└─────────────────────────────────────────┘
```

### Index de Base de Données

```sql
-- Mouvement indexes
CREATE INDEX idx_mouvement_date ON Mouvement(date);
CREATE INDEX idx_mouvement_intervenant ON Mouvement(intervenantId);
CREATE INDEX idx_mouvement_type ON Mouvement(type);
CREATE INDEX idx_mouvement_category ON Mouvement(category);
CREATE INDEX idx_mouvement_modality ON Mouvement(modality);

-- Advance indexes
CREATE INDEX idx_advance_intervenant ON Advance(intervenantId);
CREATE INDEX idx_advance_status ON Advance(status);
CREATE INDEX idx_advance_duedate ON Advance(dueDate);

-- Alert indexes
CREATE INDEX idx_alert_dismissed ON Alert(dismissed);
CREATE INDEX idx_alert_type ON Alert(type);
CREATE INDEX idx_alert_created ON Alert(createdAt);

-- CashReconciliation indexes
CREATE INDEX idx_reconciliation_date ON CashReconciliation(date);
```

## Déploiement

```
┌─────────────────────────────────────────┐
│  Development                            │
│  - SQLite local                         │
│  - npm run dev                          │
│  - Hot reload                           │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Staging                                │
│  - Railway / Vercel                     │
│  - SQLite with persistent volume        │
│  - Auto-deploy from git branch          │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│  Production                             │
│  - VPS / Railway                        │
│  - SQLite with backups                  │
│  - PM2 process manager                  │
│  - Nginx reverse proxy                  │
│  - SSL certificate                      │
│  - Daily database backups               │
└─────────────────────────────────────────┘
```

Cette architecture garantit :

- ✅ Séparation des responsabilités
- ✅ Scalabilité
- ✅ Maintenabilité
- ✅ Sécurité
- ✅ Performance
- ✅ Testabilité
