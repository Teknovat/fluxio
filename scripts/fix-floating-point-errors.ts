/**
 * Script to fix floating point errors in the database
 * Rounds all monetary values to 2 decimal places
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function roundToTwoDecimals(value: number): number {
    return Math.round(value * 100) / 100;
}

async function fixDisbursements() {
    console.log('🔧 Fixing disbursements...');

    const disbursements = await prisma.disbursement.findMany();

    let fixed = 0;
    for (const disbursement of disbursements) {
        const roundedInitial = roundToTwoDecimals(disbursement.initialAmount);
        const roundedRemaining = roundToTwoDecimals(disbursement.remainingAmount);

        if (roundedInitial !== disbursement.initialAmount || roundedRemaining !== disbursement.remainingAmount) {
            await prisma.disbursement.update({
                where: { id: disbursement.id },
                data: {
                    initialAmount: roundedInitial,
                    remainingAmount: roundedRemaining,
                },
            });
            fixed++;
            console.log(`  ✓ Fixed disbursement ${disbursement.id}: ${disbursement.remainingAmount} → ${roundedRemaining}`);
        }
    }

    console.log(`✅ Fixed ${fixed} disbursements\n`);
}

async function fixDocuments() {
    console.log('🔧 Fixing documents...');

    const documents = await prisma.document.findMany();

    let fixed = 0;
    for (const document of documents) {
        const roundedTotal = roundToTwoDecimals(document.totalAmount);
        const roundedPaid = roundToTwoDecimals(document.paidAmount);
        const roundedRemaining = roundToTwoDecimals(document.remainingAmount);

        if (
            roundedTotal !== document.totalAmount ||
            roundedPaid !== document.paidAmount ||
            roundedRemaining !== document.remainingAmount
        ) {
            await prisma.document.update({
                where: { id: document.id },
                data: {
                    totalAmount: roundedTotal,
                    paidAmount: roundedPaid,
                    remainingAmount: roundedRemaining,
                },
            });
            fixed++;
            console.log(`  ✓ Fixed document ${document.reference}: ${document.remainingAmount} → ${roundedRemaining}`);
        }
    }

    console.log(`✅ Fixed ${fixed} documents\n`);
}

async function fixMouvements() {
    console.log('🔧 Fixing mouvements...');

    const mouvements = await prisma.mouvement.findMany();

    let fixed = 0;
    for (const mouvement of mouvements) {
        const roundedAmount = roundToTwoDecimals(mouvement.amount);

        if (roundedAmount !== mouvement.amount) {
            await prisma.mouvement.update({
                where: { id: mouvement.id },
                data: {
                    amount: roundedAmount,
                },
            });
            fixed++;
            console.log(`  ✓ Fixed mouvement ${mouvement.id}: ${mouvement.amount} → ${roundedAmount}`);
        }
    }

    console.log(`✅ Fixed ${fixed} mouvements\n`);
}

async function fixJustifications() {
    console.log('🔧 Fixing justifications...');

    const justifications = await prisma.justification.findMany();

    let fixed = 0;
    for (const justification of justifications) {
        const roundedAmount = roundToTwoDecimals(justification.amount);

        if (roundedAmount !== justification.amount) {
            await prisma.justification.update({
                where: { id: justification.id },
                data: {
                    amount: roundedAmount,
                },
            });
            fixed++;
            console.log(`  ✓ Fixed justification ${justification.id}: ${justification.amount} → ${roundedAmount}`);
        }
    }

    console.log(`✅ Fixed ${fixed} justifications\n`);
}

async function main() {
    console.log('🚀 Starting floating point error fix...\n');

    try {
        await fixDisbursements();
        await fixDocuments();
        await fixMouvements();
        await fixJustifications();

        console.log('✨ All done! Database cleaned successfully.');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
