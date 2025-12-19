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

        // Fetch all disbursements for this intervenant with justifications and returns
        const disbursements = await prisma.disbursement.findMany({
            where: {
                tenantId,
                intervenantId: intervenant.id,
            },
            include: {
                justifications: {
                    select: {
                        amount: true,
                    },
                },
                returns: {
                    select: {
                        amount: true,
                    },
                },
            },
        });

        // Calculate "À justifier ou retourner" from disbursements
        // This is: Total Disbursed - Total Justified - Total Returned
        const totalDisbursed = disbursements.reduce((sum, d) => sum + d.initialAmount, 0);
        const totalJustified = disbursements.reduce(
            (sum, d) => sum + (d.justifications?.reduce((s, j) => s + j.amount, 0) || 0),
            0
        );
        const totalReturned = disbursements.reduce(
            (sum, d) => sum + (d.returns?.reduce((s, r) => s + r.amount, 0) || 0),
            0
        );

        // Balance = Amount remaining in intervenant's pocket (to justify or return)
        const balance = totalDisbursed - totalJustified - totalReturned;

        const totalEntries = movements
            .filter((m) => m.type === MouvementType.ENTREE)
            .reduce((sum, m) => sum + m.amount, 0);

        const totalExits = movements
            .filter((m) => m.type === MouvementType.SORTIE)
            .reduce((sum, m) => sum + m.amount, 0);

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

    // Sort by balance descending (highest amount to justify/return first)
    balances.sort((a, b) => b.balance - a.balance);

    return balances;
}
