import { describe, it, expect } from "vitest";
import {
    calculateDisbursementRemaining,
    determineDisbursementStatus,
    isDisbursementOverdue,
    getDaysOutstanding,
} from "./disbursement-calculations";
import {
    Disbursement,
    DisbursementStatus,
    Justification,
    Mouvement,
    MouvementType,
    JustificationCategory,
} from "@/types";

describe("calculateDisbursementRemaining", () => {
    it("should calculate remaining with justifications only", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 500,
            status: DisbursementStatus.PARTIALLY_JUSTIFIED,
            justifications: [
                {
                    id: "just1",
                    tenantId: "tenant1",
                    disbursementId: "disb1",
                    date: new Date(),
                    amount: 300,
                    category: JustificationCategory.STOCK_PURCHASE,
                    createdBy: "user1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: "just2",
                    tenantId: "tenant1",
                    disbursementId: "disb1",
                    date: new Date(),
                    amount: 200,
                    category: JustificationCategory.SUPPLIES,
                    createdBy: "user1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            returns: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const remaining = calculateDisbursementRemaining(disbursement);
        expect(remaining).toBe(500); // 1000 - 300 - 200
    });

    it("should calculate remaining with returns only", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 600,
            status: DisbursementStatus.PARTIALLY_JUSTIFIED,
            justifications: [],
            returns: [
                {
                    id: "ret1",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 400,
                    isDisbursement: false,
                    disbursementId: "disb1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const remaining = calculateDisbursementRemaining(disbursement);
        expect(remaining).toBe(600); // 1000 - 400
    });

    it("should calculate remaining with both justifications and returns", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 300,
            status: DisbursementStatus.PARTIALLY_JUSTIFIED,
            justifications: [
                {
                    id: "just1",
                    tenantId: "tenant1",
                    disbursementId: "disb1",
                    date: new Date(),
                    amount: 300,
                    category: JustificationCategory.STOCK_PURCHASE,
                    createdBy: "user1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            returns: [
                {
                    id: "ret1",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 400,
                    isDisbursement: false,
                    disbursementId: "disb1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const remaining = calculateDisbursementRemaining(disbursement);
        expect(remaining).toBe(300); // 1000 - 300 - 400
    });

    it("should return full amount when no justifications or returns", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 1000,
            status: DisbursementStatus.OPEN,
            justifications: [],
            returns: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const remaining = calculateDisbursementRemaining(disbursement);
        expect(remaining).toBe(1000);
    });

    it("should return zero when fully justified", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 0,
            status: DisbursementStatus.JUSTIFIED,
            justifications: [
                {
                    id: "just1",
                    tenantId: "tenant1",
                    disbursementId: "disb1",
                    date: new Date(),
                    amount: 1000,
                    category: JustificationCategory.STOCK_PURCHASE,
                    createdBy: "user1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            returns: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const remaining = calculateDisbursementRemaining(disbursement);
        expect(remaining).toBe(0);
    });
});

describe("determineDisbursementStatus", () => {
    it("should return JUSTIFIED when remaining is zero", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 0,
            status: DisbursementStatus.OPEN,
            justifications: [
                {
                    id: "just1",
                    tenantId: "tenant1",
                    disbursementId: "disb1",
                    date: new Date(),
                    amount: 1000,
                    category: JustificationCategory.STOCK_PURCHASE,
                    createdBy: "user1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            returns: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const status = determineDisbursementStatus(disbursement);
        expect(status).toBe(DisbursementStatus.JUSTIFIED);
    });

    it("should return PARTIALLY_JUSTIFIED when partially used", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 500,
            status: DisbursementStatus.OPEN,
            justifications: [
                {
                    id: "just1",
                    tenantId: "tenant1",
                    disbursementId: "disb1",
                    date: new Date(),
                    amount: 500,
                    category: JustificationCategory.STOCK_PURCHASE,
                    createdBy: "user1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            returns: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const status = determineDisbursementStatus(disbursement);
        expect(status).toBe(DisbursementStatus.PARTIALLY_JUSTIFIED);
    });

    it("should return OPEN when nothing justified or returned", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 1000,
            status: DisbursementStatus.OPEN,
            justifications: [],
            returns: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const status = determineDisbursementStatus(disbursement);
        expect(status).toBe(DisbursementStatus.OPEN);
    });

    it("should return JUSTIFIED when fully returned to cash", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 0,
            status: DisbursementStatus.OPEN,
            justifications: [],
            returns: [
                {
                    id: "ret1",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 1000,
                    isDisbursement: false,
                    disbursementId: "disb1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const status = determineDisbursementStatus(disbursement);
        expect(status).toBe(DisbursementStatus.JUSTIFIED);
    });

    it("should return PARTIALLY_JUSTIFIED with mixed justifications and returns", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 300,
            status: DisbursementStatus.OPEN,
            justifications: [
                {
                    id: "just1",
                    tenantId: "tenant1",
                    disbursementId: "disb1",
                    date: new Date(),
                    amount: 400,
                    category: JustificationCategory.STOCK_PURCHASE,
                    createdBy: "user1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            returns: [
                {
                    id: "ret1",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 300,
                    isDisbursement: false,
                    disbursementId: "disb1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const status = determineDisbursementStatus(disbursement);
        expect(status).toBe(DisbursementStatus.PARTIALLY_JUSTIFIED);
    });
});

describe("isDisbursementOverdue", () => {
    it("should return false when no due date", () => {
        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 1000,
            status: DisbursementStatus.OPEN,
            dueDate: undefined,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const isOverdue = isDisbursementOverdue(disbursement);
        expect(isOverdue).toBe(false);
    });

    it("should return false when status is JUSTIFIED", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 10);

        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 0,
            status: DisbursementStatus.JUSTIFIED,
            dueDate: pastDate,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const isOverdue = isDisbursementOverdue(disbursement);
        expect(isOverdue).toBe(false);
    });

    it("should return true when due date is in the past and not justified", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5);

        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 1000,
            status: DisbursementStatus.OPEN,
            dueDate: pastDate,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const isOverdue = isDisbursementOverdue(disbursement);
        expect(isOverdue).toBe(true);
    });

    it("should return true when partially justified and overdue", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 3);

        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 500,
            status: DisbursementStatus.PARTIALLY_JUSTIFIED,
            dueDate: pastDate,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const isOverdue = isDisbursementOverdue(disbursement);
        expect(isOverdue).toBe(true);
    });

    it("should return false when due date is in the future", () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 10);

        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 1000,
            status: DisbursementStatus.OPEN,
            dueDate: futureDate,
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const isOverdue = isDisbursementOverdue(disbursement);
        expect(isOverdue).toBe(false);
    });
});

describe("getDaysOutstanding", () => {
    it("should calculate days since creation", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 5);

        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 1000,
            status: DisbursementStatus.OPEN,
            createdAt: pastDate,
            updatedAt: new Date(),
        };

        const days = getDaysOutstanding(disbursement);
        expect(days).toBe(5);
    });

    it("should return 1 for disbursement created today", () => {
        const today = new Date();

        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 1000,
            status: DisbursementStatus.OPEN,
            createdAt: today,
            updatedAt: today,
        };

        const days = getDaysOutstanding(disbursement);
        expect(days).toBeGreaterThanOrEqual(0);
        expect(days).toBeLessThanOrEqual(1);
    });

    it("should calculate correct days for older disbursement", () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 30);

        const disbursement: Disbursement = {
            id: "disb1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            initialAmount: 1000,
            remainingAmount: 500,
            status: DisbursementStatus.PARTIALLY_JUSTIFIED,
            createdAt: pastDate,
            updatedAt: new Date(),
        };

        const days = getDaysOutstanding(disbursement);
        expect(days).toBe(30);
    });
});
