/**
 * Debug script to understand why alerts are not being created
 * Run with: npx tsx scripts/debug-alerts.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugAlerts() {
    try {
        console.log("🔍 Debugging Alert System\n");

        const tenant = await prisma.tenant.findFirst();
        if (!tenant) {
            console.error("❌ No tenant found");
            return;
        }

        console.log(`Tenant: ${tenant.name} (${tenant.id})\n`);

        // 1. Check settings
        console.log("1️⃣  SETTINGS:");
        const settings = await prisma.settings.findUnique({
            where: { tenantId: tenant.id },
        });

        if (!settings) {
            console.log("   ❌ No settings found - this is the problem!");
            console.log("   Creating default settings...\n");

            const newSettings = await prisma.settings.create({
                data: {
                    tenantId: tenant.id,
                    debtThreshold: 10000,
                    minCashBalance: 5000,
                    reconciliationGapThreshold: 500,
                    defaultAdvanceDueDays: 30,
                    disbursementOutstandingThreshold: 10000,
                    disbursementOpenDaysWarning: 30,
                    companyName: tenant.name,
                    currency: "XAF",
                    alertsEnabled: true,
                    categoriesEnabled: true,
                    advancesEnabled: true,
                },
            });

            console.log("   ✅ Settings created!");
            console.log(`   Alerts Enabled: ${newSettings.alertsEnabled}`);
        } else {
            console.log(`   Alerts Enabled: ${settings.alertsEnabled}`);
            console.log(`   Debt Threshold: ${settings.debtThreshold}`);
            console.log(`   Min Cash: ${settings.minCashBalance}`);
            console.log(`   Outstanding Threshold: ${(settings as any).disbursementOutstandingThreshold || "NOT SET"}`);
            console.log(`   Open Days Warning: ${(settings as any).disbursementOpenDaysWarning || "NOT SET"}\n`);
        }

        // 2. Check existing alerts
        console.log("2️⃣  EXISTING ALERTS:");
        const alerts = await prisma.alert.findMany({
            where: { tenantId: tenant.id },
        });
        console.log(`   Total: ${alerts.length}`);
        console.log(`   Active: ${alerts.filter((a) => !a.dismissed).length}`);
        console.log(`   Dismissed: ${alerts.filter((a) => a.dismissed).length}`);

        if (alerts.length > 0) {
            console.log("\n   Alert types:");
            const types = alerts.reduce((acc, a) => {
                acc[a.type] = (acc[a.type] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);
            Object.entries(types).forEach(([type, count]) => {
                console.log(`   - ${type}: ${count}`);
            });
        }
        console.log("");

        // 3. Check intervenants and balances
        console.log("3️⃣  INTERVENANTS:");
        const intervenants = await prisma.intervenant.findMany({
            where: { tenantId: tenant.id },
            include: {
                mouvements: true,
            },
        });
        console.log(`   Total: ${intervenants.length}\n`);

        for (const intervenant of intervenants.slice(0, 5)) {
            const balance = intervenant.mouvements.reduce((sum, m) => {
                return sum + (m.type === "SORTIE" ? m.amount : -m.amount);
            }, 0);
            console.log(`   ${intervenant.name}: ${balance.toFixed(2)} (${intervenant.mouvements.length} mouvements)`);
        }
        console.log("");

        // 4. Check cash balance
        console.log("4️⃣  CASH BALANCE:");
        const cashMovements = await prisma.mouvement.findMany({
            where: {
                tenantId: tenant.id,
                modality: "ESPECES",
            },
        });
        const cashBalance = cashMovements.reduce((sum, m) => {
            return sum + (m.type === "ENTREE" ? m.amount : -m.amount);
        }, 0);
        console.log(`   Theoretical Cash: ${cashBalance.toFixed(2)}`);
        console.log(`   Min Threshold: ${settings?.minCashBalance || 5000}`);
        console.log(`   Should trigger LOW_CASH: ${cashBalance < (settings?.minCashBalance || 5000) ? "YES ✅" : "NO ❌"}\n`);

        // 5. Check disbursements
        console.log("5️⃣  DISBURSEMENTS:");
        const disbursements = await prisma.disbursement.findMany({
            where: { tenantId: tenant.id },
            include: { intervenant: true },
        });
        console.log(`   Total: ${disbursements.length}`);
        console.log(`   Open: ${disbursements.filter((d) => d.status === "OPEN").length}`);
        console.log(`   Partially Justified: ${disbursements.filter((d) => d.status === "PARTIALLY_JUSTIFIED").length}`);
        console.log(`   Justified: ${disbursements.filter((d) => d.status === "JUSTIFIED").length}\n`);

        const now = new Date();
        const overdue = disbursements.filter((d) => d.dueDate && d.dueDate < now && d.status !== "JUSTIFIED");
        console.log(`   Overdue: ${overdue.length}`);

        const longOpen = disbursements.filter((d) => {
            const daysOld = (now.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysOld > 30 && d.status !== "JUSTIFIED";
        });
        console.log(`   Open > 30 days: ${longOpen.length}`);

        const totalOutstanding = disbursements
            .filter((d) => d.status !== "JUSTIFIED")
            .reduce((sum, d) => sum + d.remainingAmount, 0);
        console.log(`   Total Outstanding: ${totalOutstanding.toFixed(2)}`);
        console.log(`   Outstanding Threshold: ${(settings as any)?.disbursementOutstandingThreshold || 10000}`);
        console.log(`   Should trigger HIGH_OUTSTANDING: ${totalOutstanding > ((settings as any)?.disbursementOutstandingThreshold || 10000) ? "YES ✅" : "NO ❌"}\n`);

        if (disbursements.length > 0) {
            console.log("   Recent disbursements:");
            disbursements.slice(0, 3).forEach((d) => {
                const daysOld = Math.ceil((now.getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                console.log(`   - ${d.intervenant.name}: ${d.remainingAmount} (${daysOld} days old, status: ${d.status})`);
            });
        }

    } catch (error) {
        console.error("❌ Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

debugAlerts();
