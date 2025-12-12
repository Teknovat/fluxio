/**
 * Script to manually test the alert system
 * Run with: npx tsx scripts/test-alerts.ts
 */

import { PrismaClient } from '@prisma/client';
import { checkAndCreateAlerts } from '../lib/alerts';

const prisma = new PrismaClient();

async function testAlerts() {
    try {
        console.log('🔍 Testing Alert System...\n');

        // Get the first tenant (or specify your tenant ID)
        const tenant = await prisma.tenant.findFirst();

        if (!tenant) {
            console.error('❌ No tenant found. Please create a tenant first.');
            return;
        }

        console.log(`✅ Testing alerts for tenant: ${tenant.name} (${tenant.id})\n`);

        // Show some stats before checking
        const disbursementCount = await prisma.disbursement.count({
            where: { tenantId: tenant.id, status: { not: 'JUSTIFIED' } }
        });
        const intervenantCount = await prisma.intervenant.count({
            where: { tenantId: tenant.id }
        });
        const mouvementCount = await prisma.mouvement.count({
            where: { tenantId: tenant.id }
        });

        console.log('📊 Current Data:');
        console.log(`   Intervenants: ${intervenantCount}`);
        console.log(`   Mouvements: ${mouvementCount}`);
        console.log(`   Open Disbursements: ${disbursementCount}\n`);

        // Run alert checks
        const alerts = await checkAndCreateAlerts(prisma, tenant.id);

        console.log(`\n📊 Alert Check Results:`);
        console.log(`   Total alerts created: ${alerts.length}\n`);

        if (alerts.length === 0) {
            console.log('✅ No alerts triggered. System is healthy!\n');
            console.log('💡 To test alerts, try:');
            console.log('   1. Create a disbursement with past due date');
            console.log('   2. Create movements that result in low cash balance');
            console.log('   3. Create movements that result in high intervenant debt');
            console.log('   4. Create disbursements with high total outstanding\n');
        } else {
            console.log('🚨 Alerts created:\n');
            alerts.forEach((alert, index) => {
                console.log(`   ${index + 1}. [${alert.severity}] ${alert.type}`);
                console.log(`      Title: ${alert.title}`);
                console.log(`      Message: ${alert.message}`);
                console.log('');
            });
        }

        // Show current settings
        const settings = await prisma.settings.findUnique({
            where: { tenantId: tenant.id }
        });

        if (settings) {
            console.log('⚙️  Current Alert Thresholds:');
            console.log(`   Debt Threshold: ${settings.debtThreshold} ${settings.currency}`);
            console.log(`   Min Cash Balance: ${settings.minCashBalance} ${settings.currency}`);
            console.log(`   Reconciliation Gap: ${settings.reconciliationGapThreshold} ${settings.currency}`);
            console.log(`   Outstanding Disbursements: ${(settings as any).disbursementOutstandingThreshold || 10000} ${settings.currency}`);
            console.log(`   Long Open Days Warning: ${(settings as any).disbursementOpenDaysWarning || 30} days`);
            console.log(`   Alerts Enabled: ${settings.alertsEnabled ? 'Yes' : 'No'}\n`);
        }

        // Show detailed disbursement info for debugging
        const disbursements = await prisma.disbursement.findMany({
            where: { tenantId: tenant.id },
            include: { intervenant: true },
            orderBy: { createdAt: 'desc' },
            take: 5
        });

        if (disbursements.length > 0) {
            console.log('🔍 Recent Disbursements (for debugging):');
            disbursements.forEach((d, i) => {
                const daysOld = Math.ceil((new Date().getTime() - d.createdAt.getTime()) / (1000 * 60 * 60 * 24));
                const isOverdue = d.dueDate && d.dueDate < new Date();
                console.log(`   ${i + 1}. ${d.intervenant.name}: ${d.remainingAmount} ${settings?.currency || 'TND'}`);
                console.log(`      Status: ${d.status}, Days old: ${daysOld}, Overdue: ${isOverdue ? 'Yes' : 'No'}`);
                if (d.dueDate) {
                    console.log(`      Due date: ${d.dueDate.toLocaleDateString('fr-FR')}`);
                }
            });
            console.log('');
        }

    } catch (error) {
        console.error('❌ Error testing alerts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testAlerts();
