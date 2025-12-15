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
    COLLABORATEUR = "COLLABORATEUR",
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
    REMBOURSEMENT_ASSOCIES = "REMBOURSEMENT_ASSOCIES",
    VENTES = "VENTES",
    CHARGES_FIXES = "CHARGES_FIXES",
    AUTRES = "AUTRES",
}

/**
 * @deprecated Use DisbursementStatus instead. This enum is kept for backward compatibility during migration.
 */
export enum AdvanceStatus {
    EN_COURS = "EN_COURS",
    REMBOURSE_PARTIEL = "REMBOURSE_PARTIEL",
    REMBOURSE_TOTAL = "REMBOURSE_TOTAL",
}

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

export enum DocumentType {
    INVOICE = "INVOICE",
    PAYSLIP = "PAYSLIP",
    PURCHASE_ORDER = "PURCHASE_ORDER",
    CONTRACT = "CONTRACT",
    OTHER = "OTHER",
}

export enum DocumentStatus {
    UNPAID = "UNPAID",
    PARTIALLY_PAID = "PARTIALLY_PAID",
    PAID = "PAID",
}

export enum AlertType {
    DEBT_THRESHOLD = "DEBT_THRESHOLD",
    LOW_CASH = "LOW_CASH",
    OVERDUE_DISBURSEMENT = "OVERDUE_DISBURSEMENT",
    LONG_OPEN_DISBURSEMENT = "LONG_OPEN_DISBURSEMENT",
    HIGH_OUTSTANDING_DISBURSEMENTS = "HIGH_OUTSTANDING_DISBURSEMENTS",
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
    /** @deprecated Use disbursements instead */
    advances?: Advance[];
    disbursements?: Disbursement[];
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
    isDisbursement: boolean;
    disbursementId?: string;
    disbursement?: Disbursement;
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

/**
 * @deprecated Use Disbursement interface instead. This interface is kept for backward compatibility during migration.
 */
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

// Disbursement interface
export interface Disbursement {
    id: string;
    tenantId: string;
    mouvementId: string;
    mouvement?: Mouvement;
    intervenantId: string;
    intervenant?: Intervenant;
    initialAmount: number;
    remainingAmount: number;
    dueDate?: Date;
    status: DisbursementStatus;
    category?: DisbursementCategory;
    justifications?: Justification[];
    returns?: Mouvement[];
    createdAt: Date;
    updatedAt: Date;
}

// Justification interface
export interface Justification {
    id: string;
    tenantId: string;
    disbursementId: string;
    disbursement?: Disbursement;
    documentId?: string;
    document?: Document;
    date: Date;
    amount: number;
    category: JustificationCategory;
    reference?: string;
    note?: string;
    attachments?: string;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

// Document interface
export interface Document {
    id: string;
    tenantId: string;
    type: DocumentType;
    reference: string;
    intervenantId: string;
    intervenant?: Intervenant;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: DocumentStatus;
    issueDate: Date;
    dueDate?: Date;
    notes?: string;
    attachments?: string[];
    justifications?: Justification[];
    createdAt: Date;
    updatedAt: Date;
}

// DocumentWithPayments interface for detailed document view
export interface DocumentWithPayments extends Document {
    payments: Array<{
        justification: Justification;
        disbursement: Disbursement;
        intervenant: Intervenant;
    }>;
}

// DocumentStats interface for dashboard statistics
export interface DocumentStats {
    unpaid: { count: number; amount: number };
    overdue: { count: number; amount: number };
    dueWithin7Days: { count: number; amount: number };
    partiallyPaid: { count: number; amount: number };
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

// CustomCategory interface for tenant-specific categories
export interface CustomCategory {
    id: string;
    tenantId: string;
    code: string;
    label: string;
    color: string;
    active: boolean;
    isDefault: boolean;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
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

// CashDashboardData interface for cash dashboard page
export interface CashDashboardData {
    currentBalance: number;
    todayInflows: number;
    todayOutflows: number;
    netChangeToday: number;
    recentMovements: Mouvement[];
    balanceTrend: { date: string; balance: number }[];
    outstandingDisbursements: number;
    alerts: Alert[];
}
