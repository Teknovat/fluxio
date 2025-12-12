/**
 * Update existing Settings with new default values for disbursement alert fields
 * Run with: npx tsx scripts/update-settings-defaults.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function updateSettings() {
    try {
        console.log("🔧 Updating Settings with new alert configuration fields...");

        const allSettings = await prisma.settings.findMany();
        console.log(`Found ${allSettings.length} Settings record(s)`);

        for (const settings of allSettings) {
            await prisma.settings.update({
                where: { id: settings.id },
                data: {
                    disbursementOutstandingThreshold: 10000,
                    disbursementOpenDaysWarning: 30,
                },
            });
            console.log(`✅ Updated settings for tenant ${settings.tenantId}`);
        }

        console.log("\n✅ All Settings updated successfully!");
    } catch (error) {
        console.error("❌ Error updating settings:", error);
    } finally {
        await prisma.$disconnect();
    }
}

updateSettings();
