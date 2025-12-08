import { PrismaClient } from "@prisma/client";
import { MouvementType, Modality, Mouvement } from "@/types";

/**
 * Calculate the current cash balance from all cash movements
 * Cash balance = Total ENTREE (inflows) - Total SORTIE (outflows)
 * Only includes movements with modality = ESPECES
 */
export async function calculateCurrentCashBalance(
    prisma: PrismaClient,
    tenantId: string
): Promise<number> {
    // Get all cash movements (modality = ESPECES)
    const movements = await prisma.mouvement.findMany({
        where: {
            tenantId,
            modality: Modality.ESPECES,
        },
    });

    const inflows = movements
        .filter((m) => m.type === MouvementType.ENTREE)
        .reduce((sum, m) => sum + m.amount, 0);

    const outflows = movements
        .filter((m) => m.type === MouvementType.SORTIE)
        .reduce((sum, m) => sum + m.amount, 0);

    return inflows - outflows;
}

/**
 * Calculate cash balance trend over a specified number of days
 * Returns an array of { date, balance } objects showing the running balance each day
 */
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
            modality: Modality.ESPECES,
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

/**
 * Get today's cash summary (inflows, outflows, net change)
 * Only includes movements with modality = ESPECES and date = today
 */
export async function getTodayCashSummary(
    prisma: PrismaClient,
    tenantId: string
): Promise<{
    inflows: number;
    outflows: number;
    net: number;
    count: number;
}> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const movements = await prisma.mouvement.findMany({
        where: {
            tenantId,
            modality: Modality.ESPECES,
            date: { gte: today },
        },
    });

    const inflows = movements
        .filter((m) => m.type === MouvementType.ENTREE)
        .reduce((sum, m) => sum + m.amount, 0);

    const outflows = movements
        .filter((m) => m.type === MouvementType.SORTIE)
        .reduce((sum, m) => sum + m.amount, 0);

    return {
        inflows,
        outflows,
        net: inflows - outflows,
        count: movements.length,
    };
}

/**
 * Get recent cash movements
 * Returns the most recent cash movements (modality = ESPECES)
 * Sorted by date descending
 */
export async function getRecentCashMovements(
    prisma: PrismaClient,
    tenantId: string,
    limit: number = 20
): Promise<Mouvement[]> {
    const movements = await prisma.mouvement.findMany({
        where: {
            tenantId,
            modality: Modality.ESPECES,
        },
        include: {
            intervenant: true,
        },
        orderBy: { date: "desc" },
        take: limit,
    });

    return movements as Mouvement[];
}
