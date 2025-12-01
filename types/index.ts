// Enums matching Prisma schema (using string literals for SQLite compatibility)

export enum Role {
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
    STOCK = "STOCK",
    SALAIRE = "SALAIRE",
    AUTRE = "AUTRE",
}

// User interface
export interface User {
    id: string;
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
    name: string;
    type: IntervenantType;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Mouvement interface
export interface Mouvement {
    id: string;
    date: Date;
    intervenantId: string;
    intervenant?: Intervenant;
    type: MouvementType;
    amount: number;
    reference?: string;
    modality?: Modality;
    note?: string;
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
