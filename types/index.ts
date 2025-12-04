// Enums matching Prisma schema (using string literals for SQLite compatibility)

export enum Role {
    SUPER_ADMIN = "SUPER_ADMIN",
    ADMIN = "ADMIN",
    USER = "USER",
}

export enum IntervenantType {
    CLIENT = "CLIENT",
    FOURNISSEUR = "FOURNISSEUR",
    ASSOCIE = "ASSOCIE",
    CAISSE_BANQUE = "CAISSE_BANQUE",
    AUTRE = "AUTRE",
}

export enum MouvementType {
    ENTREE = "ENTREE",
    SORTIE = "SORTIE",
}

export enum Modality {
    ESPECES = "ESPECES",
    CHEQUE = "CHEQUE",
    VIREMENT = "VIREMENT",
    AUTRE = "AUTRE",
}

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

// Tenant interface
export interface Tenant {
    id: string;
    name: string;
    slug: string;
    subdomain?: string;
    active: boolean;
    logo?: string;
    primaryColor?: string;
    createdAt: Date;
    updatedAt: Date;
}

// User interface
export interface User {
    id: string;
    tenantId: string;
    tenant?: Tenant;
    name: string;
    email: string;
    role: Role;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Intervenant interface
export interface Intervenant {
    id: string;
    tenantId: string;
    tenant?: Tenant;
    name: string;
    type: IntervenantType;
    active: boolean;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

// Mouvement interface
export interface Mouvement {
    id: string;
    tenantId: string;
    tenant?: Tenant;
    date: Date;
    intervenantId: string;
    intervenant?: Intervenant;
    type: MouvementType;
    amount: number;
    reference?: string;
    modality?: Modality;
    category?: MovementCategory;
    note?: string;
    isAdvance: boolean;
    advanceId?: string;
    advance?: Advance;
    createdAt: Date;
    updatedAt: Date;
}

// MouvementSummary interface for aggregated data
export interface MouvementSummary {
    totalEntree: number;
    totalSortie: number;
    solde: number;
}

// MouvementFilters interface for filtering movements
export interface MouvementFilters {
    dateFrom?: string;
    dateTo?: string;
    intervenantId?: string;
    type?: MouvementType;
}

// Advance interface
export interface Advance {
    id: string;
    tenantId: string;
    mouvementId: string;
    mouvement?: Mouvement;
    intervenantId: string;
    intervenant?: Intervenant;
    amount: number;
    dueDate?: Date;
    status: AdvanceStatus;
    reimbursements?: Mouvement[];
    createdAt: Date;
    updatedAt: Date;
}

// CashReconciliation interface
export interface CashReconciliation {
    id: string;
    tenantId: string;
    date: Date;
    theoreticalBalance: number;
    physicalCount: number;
    gap: number;
    note?: string;
    userId: string;
    user?: User;
    createdAt: Date;
}

// Alert interface
export interface Alert {
    id: string;
    tenantId: string;
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

// Settings interface
export interface Settings {
    id: string;
    tenantId: string;
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

// IntervenantBalance interface for balance calculations
export interface IntervenantBalance {
    intervenant: Intervenant;
    totalEntries: number;
    totalExits: number;
    balance: number;
    movementCount: number;
    lastMovementDate?: Date;
}

// BalanceSummary interface for aggregated balance data
export interface BalanceSummary {
    totalOwedToCompany: number;
    totalCompanyOwes: number;
    netBalance: number;
}

// CategorySummary interface for category reports
export interface CategorySummary {
    category: MovementCategory;
    amount: number;
    count: number;
    percentage: number;
}

// DashboardData interface for dashboard page
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
