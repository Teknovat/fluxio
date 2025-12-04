import { PrismaClient } from "@prisma/client";
import {
    Alert,
    AlertType,
    Settings,
    AdvanceStatus,
    Modality,
    MouvementType,
} from "@/types";
import { calculateAllBalances, calculateTheoreticalCashBalance } from "./calculations";

/**
 * Check debt thresholds for all intervenants and create alerts
 * Creates an alert when an intervenant's debt exceeds the configured threshold
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to check
 * @param settings - Settings containing the debt threshold
 * @returns Array of created alerts
 */
async function checkDebtThresholds(
    prisma: PrismaClient,
    tenantId: string,
    settings: Settings
): Promise<Partial<Alert>[]> {
    const alerts: Partial<Alert>[] = [];

    // Calculate balances for all intervenants
    const balances = await calculateAllBalances(prisma, tenantId);

    // Check each intervenant's balance against threshold
    for (const balance of balances) {
        // Positive balance means intervenant owes money to the company
        if (balance.balance > settings.debtThreshold) {
            // Check if alert already exists and is not dismissed
            const existingAlert = await prisma.alert.findFirst({
                where: {
                    tenantId,
                    type: AlertType.DEBT_THRESHOLD,
                    relatedId: balance.intervenant.id,
                    dismissed: false,
                },
            });

            // Only create alert if one doesn't already exist
            if (!existingAlert) {
                alerts.push({
                    tenantId,
                    type: AlertType.DEBT_THRESHOLD,
                    title: `Dette élevée: ${balance.intervenant.name}`,
                    message: `${balance.intervenant.name} doit ${balance.balance.toFixed(2)} ${settings.currency} à la société`,
                    severity: "WARNING",
                    relatedId: balance.intervenant.id,
                    dismissed: false,
                });
            }
        }
    }

    return alerts;
}

/**
 * Check if cash balance is below minimum threshold and create alert
 * Creates an alert when theoretical cash balance falls below configured minimum
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to check
 * @param settings - Settings containing the minimum cash balance
 * @returns Array of created alerts (0 or 1)
 */
async function checkLowCash(
    prisma: PrismaClient,
    tenantId: string,
    settings: Settings
): Promise<Partial<Alert>[]> {
    const alerts: Partial<Alert>[] = [];

    // Fetch all cash movements for the tenant
    const movements = await prisma.mouvement.findMany({
        where: {
            tenantId,
            modality: Modality.ESPECES,
        },
    });

    // Calculate theoretical cash balance
    // Cast to any to handle Prisma type differences
    const cashBalance = calculateTheoreticalCashBalance(movements as any);

    // Check if below minimum threshold
    if (cashBalance < settings.minCashBalance) {
        // Check if alert already exists and is not dismissed
        const existingAlert = await prisma.alert.findFirst({
            where: {
                tenantId,
                type: AlertType.LOW_CASH,
                dismissed: false,
            },
        });

        // Only create alert if one doesn't already exist
        if (!existingAlert) {
            alerts.push({
                tenantId,
                type: AlertType.LOW_CASH,
                title: "Caisse faible",
                message: `Le solde de caisse (${cashBalance.toFixed(2)} ${settings.currency}) est en dessous du minimum (${settings.minCashBalance.toFixed(2)} ${settings.currency})`,
                severity: "ERROR",
                dismissed: false,
            });
        }
    }

    return alerts;
}

/**
 * Check for overdue advances and create alerts
 * Creates alerts for advances that are past their due date and not fully reimbursed
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to check
 * @param settings - Settings (for currency formatting)
 * @returns Array of created alerts
 */
async function checkOverdueAdvances(
    prisma: PrismaClient,
    tenantId: string,
    settings: Settings
): Promise<Partial<Alert>[]> {
    const alerts: Partial<Alert>[] = [];

    const now = new Date();

    // Find all overdue advances that are not fully reimbursed
    const overdueAdvances = await prisma.advance.findMany({
        where: {
            tenantId,
            status: {
                not: AdvanceStatus.REMBOURSE_TOTAL,
            },
            dueDate: {
                lt: now,
            },
        },
        include: {
            intervenant: true,
        },
    });

    // Create alert for each overdue advance
    for (const advance of overdueAdvances) {
        // Check if alert already exists and is not dismissed
        const existingAlert = await prisma.alert.findFirst({
            where: {
                tenantId,
                type: AlertType.OVERDUE_ADVANCE,
                relatedId: advance.id,
                dismissed: false,
            },
        });

        // Only create alert if one doesn't already exist
        if (!existingAlert) {
            const dueDate = advance.dueDate!;
            const formattedDate = dueDate.toLocaleDateString("fr-FR");

            alerts.push({
                tenantId,
                type: AlertType.OVERDUE_ADVANCE,
                title: `Avance en retard: ${advance.intervenant.name}`,
                message: `Avance de ${advance.amount.toFixed(2)} ${settings.currency} en retard depuis le ${formattedDate}`,
                severity: "WARNING",
                relatedId: advance.id,
                dismissed: false,
            });
        }
    }

    return alerts;
}

/**
 * Check for large reconciliation gaps and create alerts
 * Creates alerts when the gap between physical count and theoretical balance exceeds threshold
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to check
 * @param settings - Settings containing the reconciliation gap threshold
 * @returns Array of created alerts
 */
async function checkReconciliationGap(
    prisma: PrismaClient,
    tenantId: string,
    settings: Settings
): Promise<Partial<Alert>[]> {
    const alerts: Partial<Alert>[] = [];

    // Get the most recent reconciliation
    const lastReconciliation = await prisma.cashReconciliation.findFirst({
        where: {
            tenantId,
        },
        orderBy: {
            date: "desc",
        },
    });

    // Check if there is a reconciliation and if the gap exceeds threshold
    if (lastReconciliation && Math.abs(lastReconciliation.gap) > settings.reconciliationGapThreshold) {
        // Check if alert already exists and is not dismissed
        const existingAlert = await prisma.alert.findFirst({
            where: {
                tenantId,
                type: AlertType.RECONCILIATION_GAP,
                relatedId: lastReconciliation.id,
                dismissed: false,
            },
        });

        // Only create alert if one doesn't already exist
        if (!existingAlert) {
            const formattedDate = lastReconciliation.date.toLocaleDateString("fr-FR");

            alerts.push({
                tenantId,
                type: AlertType.RECONCILIATION_GAP,
                title: "Écart de caisse important",
                message: `Écart de ${Math.abs(lastReconciliation.gap).toFixed(2)} ${settings.currency} détecté lors du rapprochement du ${formattedDate}`,
                severity: "ERROR",
                relatedId: lastReconciliation.id,
                dismissed: false,
            });
        }
    }

    return alerts;
}

/**
 * Check all alert conditions and create alerts as needed
 * Main function that orchestrates all alert checking logic
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to check alerts for
 * @returns Array of created alerts
 */
export async function checkAndCreateAlerts(
    prisma: PrismaClient,
    tenantId: string
): Promise<Alert[]> {
    // Fetch settings for the tenant
    const settings = await prisma.settings.findUnique({
        where: {
            tenantId,
        },
    });

    // If no settings exist or alerts are disabled, return empty array
    if (!settings || !settings.alertsEnabled) {
        return [];
    }

    // Collect all alerts from different checks
    const allAlerts: Partial<Alert>[] = [];

    // Run all alert checks
    const debtAlerts = await checkDebtThresholds(prisma, tenantId, settings as Settings);
    const cashAlerts = await checkLowCash(prisma, tenantId, settings as Settings);
    const advanceAlerts = await checkOverdueAdvances(prisma, tenantId, settings as Settings);
    const reconciliationAlerts = await checkReconciliationGap(prisma, tenantId, settings as Settings);

    allAlerts.push(...debtAlerts, ...cashAlerts, ...advanceAlerts, ...reconciliationAlerts);

    // Create all alerts in the database
    const createdAlerts: Alert[] = [];

    for (const alert of allAlerts) {
        const created = await prisma.alert.create({
            data: {
                tenantId: alert.tenantId!,
                type: alert.type!,
                title: alert.title!,
                message: alert.message!,
                severity: alert.severity!,
                relatedId: alert.relatedId,
                dismissed: false,
            },
        });

        createdAlerts.push(created as Alert);
    }

    return createdAlerts;
}
