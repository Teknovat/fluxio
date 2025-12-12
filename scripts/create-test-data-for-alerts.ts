/**
 * Script to create test data that will trigger alerts AND check them
 * Run with: npx tsx scripts/create-test-data-for-alerts.ts
 */

import { PrismaClient } from "@prisma/client";
import { checkAndCreateAlerts } from "../lib/alerts";

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log("🔧 Creating test data to trigger alerts...\n");

    // Get the first tenant and user
    const tenant = await prisma.tenant.findFirst();
    const user = await prisma.user.findFirst();

    if (!tenant || !user) {
      console.error("❌ No tenant or user found. Please create them first.");
      return;
    }

    console.log(`✅ Using tenant: ${tenant.name}`);
    console.log(`✅ Using user: ${user.name}\n`);

    // 1. Create intervenant with high debt (triggers DEBT_THRESHOLD alert)
    console.log("1️⃣  Creating intervenant with high debt...");
    const highDebtIntervenant = await prisma.intervenant.create({
      data: {
        tenantId: tenant.id,
        name: "Test - High Debt Intervenant",
        type: "ASSOCIE",
        active: true,
      },
    });

    // Create a large SORTIE movement (15000 > default threshold of 10000)
    await prisma.mouvement.create({
      data: {
        tenantId: tenant.id,
        date: new Date(),
        intervenantId: highDebtIntervenant.id,
        type: "SORTIE",
        amount: 15000,
        modality: "ESPECES",
        category: "AUTRES",
        note: "Test - High debt movement",
        isDisbursement: false,
      },
    });
    console.log("   ✅ Created high debt scenario\n");

    // 2. Create movements that result in low cash (triggers LOW_CASH alert)
    console.log("2️⃣  Creating low cash scenario...");
    const cashIntervenant = await prisma.intervenant.create({
      data: {
        tenantId: tenant.id,
        name: "Test - Cash Operations",
        type: "CAISSE_BANQUE",
        active: true,
      },
    });

    // Create small inflow
    await prisma.mouvement.create({
      data: {
        tenantId: tenant.id,
        date: new Date(),
        intervenantId: cashIntervenant.id,
        type: "ENTREE",
        amount: 2000,
        modality: "ESPECES",
        category: "AUTRES",
        note: "Test - Small cash inflow",
        isDisbursement: false,
      },
    });

    // Create large outflow to make balance < 5000
    await prisma.mouvement.create({
      data: {
        tenantId: tenant.id,
        date: new Date(),
        intervenantId: cashIntervenant.id,
        type: "SORTIE",
        amount: 1000,
        modality: "ESPECES",
        category: "AUTRES",
        note: "Test - Cash outflow",
        isDisbursement: false,
      },
    });
    console.log("   ✅ Created low cash scenario\n");

    // 3. Create overdue disbursement (triggers OVERDUE_DISBURSEMENT alert)
    console.log("3️⃣  Creating overdue disbursement...");
    const disbursementIntervenant = await prisma.intervenant.create({
      data: {
        tenantId: tenant.id,
        name: "Test - Overdue Disbursement",
        type: "COLLABORATEUR",
        active: true,
      },
    });

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10); // 10 days ago

    const overdueMouvement = await prisma.mouvement.create({
      data: {
        tenantId: tenant.id,
        date: pastDate,
        intervenantId: disbursementIntervenant.id,
        type: "SORTIE",
        amount: 3000,
        modality: "ESPECES",
        category: "AUTRES",
        note: "Test - Overdue disbursement",
        isDisbursement: true,
      },
    });

    await prisma.disbursement.create({
      data: {
        tenantId: tenant.id,
        mouvementId: overdueMouvement.id,
        intervenantId: disbursementIntervenant.id,
        initialAmount: 3000,
        remainingAmount: 3000,
        dueDate: pastDate, // Already past
        status: "OPEN",
      },
    });
    console.log("   ✅ Created overdue disbursement\n");

    // 4. Create long-open disbursement (triggers LONG_OPEN_DISBURSEMENT alert)
    console.log("4️⃣  Creating long-open disbursement...");
    const longOpenIntervenant = await prisma.intervenant.create({
      data: {
        tenantId: tenant.id,
        name: "Test - Long Open Disbursement",
        type: "FOURNISSEUR",
        active: true,
      },
    });

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 35);

    const longOpenMouvement = await prisma.mouvement.create({
      data: {
        tenantId: tenant.id,
        date: oldDate,
        intervenantId: longOpenIntervenant.id,
        type: "SORTIE",
        amount: 2000,
        modality: "ESPECES",
        category: "AUTRES",
        note: "Test - Long open disbursement",
        isDisbursement: true,
      },
    });

    const disbursement = await prisma.disbursement.create({
      data: {
        tenantId: tenant.id,
        mouvementId: longOpenMouvement.id,
        intervenantId: longOpenIntervenant.id,
        initialAmount: 2000,
        remainingAmount: 2000,
        status: "OPEN",
      },
    });

    // Update createdAt to past date using raw SQL
    await prisma.$executeRaw`
      UPDATE Disbursement 
      SET createdAt = ${oldDate.toISOString()}
      WHERE id = ${disbursement.id}
    `;
    console.log("   ✅ Created long-open disbursement\n");

    // 5. Create multiple disbursements for high outstanding (triggers HIGH_OUTSTANDING_DISBURSEMENTS)
    console.log("5️⃣  Creating high outstanding disbursements...");
    for (let i = 1; i <= 3; i++) {
      const intervenant = await prisma.intervenant.create({
        data: {
          tenantId: tenant.id,
          name: `Test - Outstanding ${i}`,
          type: "ASSOCIE",
          active: true,
        },
      });

      const mouvement = await prisma.mouvement.create({
        data: {
          tenantId: tenant.id,
          date: new Date(),
          intervenantId: intervenant.id,
          type: "SORTIE",
          amount: 4000,
          modality: "ESPECES",
          category: "AUTRES",
          note: `Test - Outstanding disbursement ${i}`,
          isDisbursement: true,
        },
      });

      await prisma.disbursement.create({
        data: {
          tenantId: tenant.id,
          mouvementId: mouvement.id,
          intervenantId: intervenant.id,
          initialAmount: 4000,
          remainingAmount: 4000,
          status: "OPEN",
        },
      });
    }
    console.log("   ✅ Created 3 disbursements (12000 total > 10000 threshold)\n");

    console.log("✅ Test data created successfully!\n");

    // Now check and create alerts
    console.log("🔍 Checking for alerts...\n");

    const alerts = await checkAndCreateAlerts(prisma, tenant.id);

    console.log(`\n📊 Alert Check Results:`);
    console.log(`   Total alerts created: ${alerts.length}\n`);

    if (alerts.length === 0) {
      console.log("⚠️  No alerts were created. This might indicate:");
      console.log("   1. Alerts are disabled in settings");
      console.log("   2. Alerts already exist (not dismissed)");
      console.log("   3. Test data doesn't meet alert thresholds\n");
    } else {
      console.log("🚨 Alerts created:\n");
      alerts.forEach((alert, index) => {
        console.log(`   ${index + 1}. [${alert.severity}] ${alert.type}`);
        console.log(`      ${alert.title}`);
        console.log(`      ${alert.message}\n`);
      });
    }

    // Show current settings
    const settings = await prisma.settings.findUnique({
      where: { tenantId: tenant.id },
    });

    if (settings) {
      console.log("⚙️  Current Alert Configuration:");
      console.log(`   Alerts Enabled: ${settings.alertsEnabled ? "✅ Yes" : "❌ No"}`);
      console.log(`   Debt Threshold: ${settings.debtThreshold} ${settings.currency}`);
      console.log(`   Min Cash Balance: ${settings.minCashBalance} ${settings.currency}`);
      console.log(
        `   Outstanding Disbursements: ${(settings as any).disbursementOutstandingThreshold || 10000} ${settings.currency}`
      );
      console.log(
        `   Long Open Days Warning: ${(settings as any).disbursementOpenDaysWarning || 30} days\n`
      );
    }

    // Show all existing alerts (including previously created ones)
    const allAlerts = await prisma.alert.findMany({
      where: { tenantId: tenant.id },
      orderBy: { createdAt: "desc" },
    });

    console.log(`📋 Total alerts in database: ${allAlerts.length}`);
    console.log(`   Active (not dismissed): ${allAlerts.filter((a) => !a.dismissed).length}`);
    console.log(`   Dismissed: ${allAlerts.filter((a) => a.dismissed).length}\n`);

    console.log("✅ Done! Check your dashboard to see the alerts.");
  } catch (error) {
    console.error("❌ Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
