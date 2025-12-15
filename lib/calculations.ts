import { PrismaClient } from "@prisma/client";
import {
    Mouvement,
    Advance,
    AdvanceStatus,
    IntervenantBalance,
    Intervenant,
    MouvementType,
    Modality,
} from "@/types";

/**
 * Calculate the balance for a specific intervenant
 * Balance = Total SORTIE to intervenant - Total ENTREE from intervenant
 * Positive balance = intervenant owes money to the company
 * Negative balance = company owes money to the intervenant
 * 
 * @param movements - Array of movements for the intervenant
 * @returns The calculated balance
 */
export function calculateIntervenantBalance(movements: Mouvement[]): number {
    const totalExits = movements
        .filter((m) => m.type === MouvementType.SORTIE)
        .reduce((sum, m) => sum + m.amount, 0);

    const totalEntries = movements
        .filter((m) => m.type === MouvementType.ENTREE)
        .reduce((sum, m) => sum + m.amount, 0);

    // Positive balance = intervenant owes company
    // Negative balance = company owes intervenant
    return totalExits - totalEntries;
}

/**
 * Calculate the theoretical cash balance based on cash movements
 * Theoretical balance = Sum of all ENTREE with ESPECES modality - Sum of all SORTIE with ESPECES modality
 * 
 * @param movements - Array of all movements
 * @returns The calculated theoretical cash balance
 */
export function calculateTheoreticalCashBalance(movements: Mouvement[]): number {
    const cashMovements = movements.filter((m) => m.modality === Modality.ESPECES);

    const entries = cashMovements
        .filter((m) => m.type === MouvementType.ENTREE)
        .reduce((sum, m) => sum + m.amount, 0);

    const exits = cashMovements
        .filter((m) => m.type === MouvementType.SORTIE)
        .reduce((sum, m) => sum + m.amount, 0);

    return entries - exits;
}

/**
 * Calculate the remaining balance for an advance
 * Remaining = Advance amount - Sum of all reimbursements
 * 
 * @param advance - The advance object with reimbursements
 * @returns The remaining balance to be reimbursed
 */
export function calculateAdvanceRemaining(advance: Advance): number {
    if (!advance.reimbursements || advance.reimbursements.length === 0) {
        return advance.amount;
    }

    const totalReimbursed = advance.reimbursements.reduce(
        (sum, r) => sum + r.amount,
        0
    );

    return advance.amount - totalReimbursed;
}

/**
 * Determine the status of an advance based on reimbursements
 * 
 * @param advance - The advance object with reimbursements
 * @returns The advance status
 */
export function determineAdvanceStatus(advance: Advance): AdvanceStatus {
    const remaining = calculateAdvanceRemaining(advance);

    if (remaining === 0) {
        return AdvanceStatus.REMBOURSE_TOTAL;
    }

    if (remaining < advance.amount) {
        return AdvanceStatus.REMBOURSE_PARTIEL;
    }

    return AdvanceStatus.EN_COURS;
}

/**
 * Calculate balances for all intervenants in a tenant
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to filter by
 * @param filters - Optional filters (type, dateFrom, dateTo)
 * @returns Array of intervenant balances
 */
export async function calculateAllBalances(
    prisma: PrismaClient,
    tenantId: string,
    filters?: {
        type?: string;
        dateFrom?: Date;
        dateTo?: Date;
    }
): Promise<IntervenantBalance[]> {
    // Build the where clause for intervenants
    const intervenantWhere: any = {
        tenantId,
        active: true,
    };

    if (filters?.type) {
        intervenantWhere.type = filters.type;
    }

    // Fetch all intervenants
    const intervenants = await prisma.intervenant.findMany({
        where: intervenantWhere,
    });

    // Build the where clause for movements
    const movementWhere: any = {
        tenantId,
    };

    if (filters?.dateFrom || filters?.dateTo) {
        movementWhere.date = {};
        if (filters.dateFrom) {
            movementWhere.date.gte = filters.dateFrom;
        }
        if (filters.dateTo) {
            movementWhere.date.lte = filters.dateTo;
        }
    }

    // Calculate balance for each intervenant
    const balances: IntervenantBalance[] = [];

    for (const intervenant of intervenants) {
        // Fetch movements for this intervenant
        const movements = await prisma.mouvement.findMany({
            where: {
                ...movementWhere,
                intervenantId: intervenant.id,
            },
            orderBy: {
                date: "desc",
            },
        });

        // Fetch all justifications for this intervenant's disbursements
        const allJustifications = await prisma.justification.findMany({
            where: {
                tenantId,
                disbursement: {
                    intervenantId: intervenant.id,
                },
            },
            select: {
                amount: true,
                documentId: true,
            },
        });

        // Calculate total amount justified with documents (filter for non-null documentId)
        const totalJustifiedWithDocuments = allJustifications
            .filter((j) => j.documentId !== null)
            .reduce((sum, j) => sum + j.amount, 0);

        const totalEntries = movements
            .filter((m) => m.type === MouvementType.ENTREE)
            .reduce((sum, m) => sum + m.amount, 0);

        const totalExits = movements
            .filter((m) => m.type === MouvementType.SORTIE)
            .reduce((sum, m) => sum + m.amount, 0);

        // Adjust balance: subtract amounts justified with documents from exits
        // because these are legitimate payments (salaries, invoices) not debts
        const adjustedExits = totalExits - totalJustifiedWithDocuments;
        const balance = adjustedExits - totalEntries;

        const lastMovementDate =
            movements.length > 0 ? movements[0].date : undefined;

        balances.push({
            intervenant: intervenant as Intervenant,
            totalEntries,
            totalExits,
            balance,
            movementCount: movements.length,
            lastMovementDate,
        });
    }

    // Sort by balance descending (highest debt first)
    balances.sort((a, b) => b.balance - a.balance);

    return balances;
}
