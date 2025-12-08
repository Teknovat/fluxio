import { PrismaClient } from "@prisma/client";
import {
    Alert,
    AlertType,
    Settings,
    DisbursementStatus,
    Modality,
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
 * Check for overdue disbursements and create alerts
 * Creates alerts for disbursements that are past their due date and not fully justified
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to check
 * @param settings - Settings (for currency formatting)
 * @returns Array of created alerts
 */
async function checkOverdueDisbursements(
    prisma: PrismaClient,
    tenantId: string,
    settings: Settings
): Promise<Partial<Alert>[]> {
    const alerts: Partial<Alert>[] = [];

    const now = new Date();

    // Find all overdue disbursements that are not fully justified
    const overdueDisbursements = await prisma.disbursement.findMany({
        where: {
            tenantId,
            status: {
                not: DisbursementStatus.JUSTIFIED,
            },
            dueDate: {
                lt: now,
            },
        },
        include: {
            intervenant: true,
        },
    });

    // Create alert for each overdue disbursement
    for (const disbursement of overdueDisbursements) {
        // Check if alert already exists and is not dismissed
        const existingAlert = await prisma.alert.findFirst({
            where: {
                tenantId,
                type: AlertType.OVERDUE_DISBURSEMENT,
                relatedId: disbursement.id,
                dismissed: false,
            },
        });

        // Only create alert if one doesn't already exist
        if (!existingAlert) {
            const dueDate = disbursement.dueDate!;
            const formattedDate = dueDate.toLocaleDateString("fr-FR");

            alerts.push({
                tenantId,
                type: AlertType.OVERDUE_DISBURSEMENT,
                title: `Décaissement en retard: ${disbursement.intervenant.name}`,
                message: `Décaissement de ${disbursement.initialAmount.toFixed(2)} ${settings.currency} en retard depuis le ${formattedDate}`,
                severity: "WARNING",
                relatedId: disbursement.id,
                dismissed: false,
            });
        }
    }

    return alerts;
}

/**
 * Check for disbursements open for more than 30 days and create alerts
 * Creates alerts for disbursements that have been open for an extended period
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to check
 * @param settings - Settings (for currency formatting)
 * @returns Array of created alerts
 */
async function checkLongOpenDisbursements(
    prisma: PrismaClient,
    tenantId: string,
    settings: Settings
): Promise<Partial<Alert>[]> {
    const alerts: Partial<Alert>[] = [];

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Find all disbursements open for more than 30 days
    const longOpenDisbursements = await prisma.disbursement.findMany({
        where: {
            tenantId,
            status: {
                not: DisbursementStatus.JUSTIFIED,
            },
            createdAt: {
                lt: thirtyDaysAgo,
            },
        },
        include: {
            intervenant: true,
        },
    });

    // Create alert for each long-open disbursement
    for (const disbursement of longOpenDisbursements) {
        // Check if alert already exists and is not dismissed
        const existingAlert = await prisma.alert.findFirst({
            where: {
                tenantId,
                type: AlertType.LONG_OPEN_DISBURSEMENT,
                relatedId: disbursement.id,
                dismissed: false,
            },
        });

        // Only create alert if one doesn't already exist
        if (!existingAlert) {
            const daysOpen = Math.ceil((now.getTime() - disbursement.createdAt.getTime()) / (1000 * 60 * 60 * 24));

            alerts.push({
                tenantId,
                type: AlertType.LONG_OPEN_DISBURSEMENT,
                title: `Décaissement ouvert depuis longtemps: ${disbursement.intervenant.name}`,
                message: `Décaissement de ${disbursement.remainingAmount.toFixed(2)} ${settings.currency} ouvert depuis ${daysOpen} jours`,
                severity: "WARNING",
                relatedId: disbursement.id,
                dismissed: false,
            });
        }
    }

    return alerts;
}

/**
 * Check if total outstanding disbursements exceed threshold and create alert
 * Creates an alert when the sum of all outstanding disbursements is too high
 * 
 * @param prisma - Prisma client instance
 * @param tenantId - The tenant ID to check
 * @param settings - Settings containing the outstanding threshold
 * @returns Array of created alerts (0 or 1)
 */
async function checkHighOutstandingDisbursements(
    prisma: PrismaClient,
    tenantId: string,
    settings: Settings
): Promise<Partial<Alert>[]> {
    const alerts: Partial<Alert>[] = [];

    // Calculate total outstanding disbursements
    const disbursements = await prisma.disbursement.findMany({
        where: {
            tenantId,
            status: {
                not: DisbursementStatus.JUSTIFIED,
            },
        },
    });

    const totalOutstanding = disbursements.reduce((sum, d) => sum + d.remainingAmount, 0);

    // Check if total outstanding exceeds threshold (default to 10000 if not set)
    const threshold = (settings as any).disbursementOutstandingThreshold || 10000;

    if (totalOutstanding > threshold) {
        // Check if alert already exists and is not dismissed
        const existingAlert = await prisma.alert.findFirst({
            where: {
                tenantId,
                type: AlertType.HIGH_OUTSTANDING_DISBURSEMENTS,
                dismissed: false,
            },
        });

        // Only create alert if one doesn't already exist
        if (!existingAlert) {
            alerts.push({
                tenantId,
                type: AlertType.HIGH_OUTSTANDING_DISBURSEMENTS,
                title: "Décaissements en cours élevés",
                message: `Le total des décaissements en cours (${totalOutstanding.toFixed(2)} ${settings.currency}) dépasse le seuil de ${threshold.toFixed(2)} ${settings.currency}`,
                severity: "WARNING",
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
    const disbursementAlerts = await checkOverdueDisbursements(prisma, tenantId, settings as Settings);
    const longOpenAlerts = await checkLongOpenDisbursements(prisma, tenantId, settings as Settings);
    const highOutstandingAlerts = await checkHighOutstandingDisbursements(prisma, tenantId, settings as Settings);
    const reconciliationAlerts = await checkReconciliationGap(prisma, tenantId, settings as Settings);

    allAlerts.push(...debtAlerts, ...cashAlerts, ...disbursementAlerts, ...longOpenAlerts, ...highOutstandingAlerts, ...reconciliationAlerts);

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
