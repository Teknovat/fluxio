import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { checkAndCreateAlerts } from "./alerts";
import {
    AlertType,
    AdvanceStatus,
    MouvementType,
    Modality,
    IntervenantType,
    Role,
} from "@/types";

const prisma = new PrismaClient();

describe("Alert Utilities", () => {
    let testTenantId: string;
    let testUserId: string;
    let testIntervenantId: string;

    beforeEach(async () => {
        // Create test tenant
        const tenant = await prisma.tenant.create({
            data: {
                name: "Test Tenant",
                slug: `test-tenant-${Date.now()}`,
                active: true,
            },
        });
        testTenantId = tenant.id;

        // Create test user
        const user = await prisma.user.create({
            data: {
                tenantId: testTenantId,
                name: "Test User",
                email: `test-${Date.now()}@example.com`,
                password: "hashed",
                role: Role.ADMIN,
            },
        });
        testUserId = user.id;

        // Create test intervenant
        const intervenant = await prisma.intervenant.create({
            data: {
                tenantId: testTenantId,
                name: "Test Intervenant",
                type: IntervenantType.ASSOCIE,
                active: true,
            },
        });
        testIntervenantId = intervenant.id;

        // Create default settings
        await prisma.settings.create({
            data: {
                tenantId: testTenantId,
                debtThreshold: 10000,
                minCashBalance: 5000,
                reconciliationGapThreshold: 500,
                defaultAdvanceDueDays: 30,
                companyName: "Test Company",
                currency: "XAF",
                alertsEnabled: true,
                categoriesEnabled: true,
                advancesEnabled: true,
            },
        });
    });

    afterEach(async () => {
        // Clean up test data
        await prisma.alert.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.cashReconciliation.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.advance.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.mouvement.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.intervenant.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.settings.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.user.deleteMany({ where: { tenantId: testTenantId } });
        await prisma.tenant.delete({ where: { id: testTenantId } });
    });

    it("should create debt threshold alert when intervenant debt exceeds threshold", async () => {
        // Create movements that result in debt > 10000
        await prisma.mouvement.create({
            data: {
                tenantId: testTenantId,
                date: new Date(),
                intervenantId: testIntervenantId,
                type: MouvementType.SORTIE,
                amount: 15000,
                modality: Modality.ESPECES,
                isAdvance: false,
            },
        });

        const alerts = await checkAndCreateAlerts(prisma, testTenantId);

        expect(alerts.length).toBeGreaterThan(0);
        const debtAlert = alerts.find((a) => a.type === AlertType.DEBT_THRESHOLD);
        expect(debtAlert).toBeDefined();
        expect(debtAlert?.severity).toBe("WARNING");
        expect(debtAlert?.relatedId).toBe(testIntervenantId);
    });

    it("should create low cash alert when cash balance is below minimum", async () => {
        // Create movements that result in low cash balance
        await prisma.mouvement.create({
            data: {
                tenantId: testTenantId,
                date: new Date(),
                intervenantId: testIntervenantId,
                type: MouvementType.ENTREE,
                amount: 3000,
                modality: Modality.ESPECES,
                isAdvance: false,
            },
        });

        await prisma.mouvement.create({
            data: {
                tenantId: testTenantId,
                date: new Date(),
                intervenantId: testIntervenantId,
                type: MouvementType.SORTIE,
                amount: 1000,
                modality: Modality.ESPECES,
                isAdvance: false,
            },
        });

        const alerts = await checkAndCreateAlerts(prisma, testTenantId);

        const cashAlert = alerts.find((a) => a.type === AlertType.LOW_CASH);
        expect(cashAlert).toBeDefined();
        expect(cashAlert?.severity).toBe("ERROR");
    });

    it("should create overdue advance alert", async () => {
        // Create an overdue advance
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        const mouvement = await prisma.mouvement.create({
            data: {
                tenantId: testTenantId,
                date: pastDate,
                intervenantId: testIntervenantId,
                type: MouvementType.SORTIE,
                amount: 5000,
                modality: Modality.ESPECES,
                isAdvance: true,
            },
        });

        await prisma.advance.create({
            data: {
                tenantId: testTenantId,
                mouvementId: mouvement.id,
                intervenantId: testIntervenantId,
                amount: 5000,
                dueDate: pastDate,
                status: AdvanceStatus.EN_COURS,
            },
        });

        const alerts = await checkAndCreateAlerts(prisma, testTenantId);

        const advanceAlert = alerts.find((a) => a.type === AlertType.OVERDUE_ADVANCE);
        expect(advanceAlert).toBeDefined();
        expect(advanceAlert?.severity).toBe("WARNING");
    });

    it("should create reconciliation gap alert when gap exceeds threshold", async () => {
        // Create a reconciliation with large gap
        await prisma.cashReconciliation.create({
            data: {
                tenantId: testTenantId,
                date: new Date(),
                theoreticalBalance: 10000,
                physicalCount: 9000,
                gap: -1000,
                userId: testUserId,
            },
        });

        const alerts = await checkAndCreateAlerts(prisma, testTenantId);

        const gapAlert = alerts.find((a) => a.type === AlertType.RECONCILIATION_GAP);
        expect(gapAlert).toBeDefined();
        expect(gapAlert?.severity).toBe("ERROR");
    });

    it("should not create alerts when alertsEnabled is false", async () => {
        // Disable alerts
        await prisma.settings.update({
            where: { tenantId: testTenantId },
            data: { alertsEnabled: false },
        });

        // Create movements that would trigger alerts
        await prisma.mouvement.create({
            data: {
                tenantId: testTenantId,
                date: new Date(),
                intervenantId: testIntervenantId,
                type: MouvementType.SORTIE,
                amount: 15000,
                modality: Modality.ESPECES,
                isAdvance: false,
            },
        });

        const alerts = await checkAndCreateAlerts(prisma, testTenantId);

        expect(alerts.length).toBe(0);
    });

    it("should not create duplicate alerts for same condition", async () => {
        // Create movements that trigger debt alert
        await prisma.mouvement.create({
            data: {
                tenantId: testTenantId,
                date: new Date(),
                intervenantId: testIntervenantId,
                type: MouvementType.SORTIE,
                amount: 15000,
                modality: Modality.ESPECES,
                isAdvance: false,
            },
        });

        // Run alert check twice
        const alerts1 = await checkAndCreateAlerts(prisma, testTenantId);
        const alerts2 = await checkAndCreateAlerts(prisma, testTenantId);

        expect(alerts1.length).toBeGreaterThan(0);
        expect(alerts2.length).toBe(0); // No new alerts should be created
    });
});
