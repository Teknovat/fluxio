import { describe, it, expect } from "vitest";
import {
    calculateIntervenantBalance,
    calculateTheoreticalCashBalance,
    calculateAdvanceRemaining,
    determineAdvanceStatus,
} from "./calculations";
import {
    Mouvement,
    MouvementType,
    Modality,
    Advance,
    AdvanceStatus,
} from "@/types";

describe("calculateIntervenantBalance", () => {
    it("should calculate positive balance when intervenant owes company", () => {
        const movements: Mouvement[] = [
            {
                id: "1",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.SORTIE,
                amount: 10000,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "2",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.ENTREE,
                amount: 3000,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const balance = calculateIntervenantBalance(movements);
        expect(balance).toBe(7000); // 10000 - 3000
    });

    it("should calculate negative balance when company owes intervenant", () => {
        const movements: Mouvement[] = [
            {
                id: "1",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.ENTREE,
                amount: 15000,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "2",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.SORTIE,
                amount: 5000,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const balance = calculateIntervenantBalance(movements);
        expect(balance).toBe(-10000); // 5000 - 15000
    });

    it("should return zero balance when entries equal exits", () => {
        const movements: Mouvement[] = [
            {
                id: "1",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.SORTIE,
                amount: 5000,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "2",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.ENTREE,
                amount: 5000,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const balance = calculateIntervenantBalance(movements);
        expect(balance).toBe(0);
    });

    it("should return zero for empty movements array", () => {
        const balance = calculateIntervenantBalance([]);
        expect(balance).toBe(0);
    });
});

describe("calculateTheoreticalCashBalance", () => {
    it("should calculate cash balance from ESPECES movements only", () => {
        const movements: Mouvement[] = [
            {
                id: "1",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.ENTREE,
                amount: 20000,
                modality: Modality.ESPECES,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "2",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.SORTIE,
                amount: 8000,
                modality: Modality.ESPECES,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
            {
                id: "3",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.ENTREE,
                amount: 10000,
                modality: Modality.CHEQUE,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const balance = calculateTheoreticalCashBalance(movements);
        expect(balance).toBe(12000); // 20000 - 8000 (ignoring CHEQUE)
    });

    it("should return zero for no cash movements", () => {
        const movements: Mouvement[] = [
            {
                id: "1",
                tenantId: "tenant1",
                date: new Date(),
                intervenantId: "int1",
                type: MouvementType.ENTREE,
                amount: 10000,
                modality: Modality.VIREMENT,
                isDisbursement: false,
                createdAt: new Date(),
                updatedAt: new Date(),
            },
        ];

        const balance = calculateTheoreticalCashBalance(movements);
        expect(balance).toBe(0);
    });
});

describe("calculateAdvanceRemaining", () => {
    it("should calculate remaining amount with partial reimbursements", () => {
        const advance: Advance = {
            id: "adv1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            amount: 10000,
            status: AdvanceStatus.EN_COURS,
            reimbursements: [
                {
                    id: "reimb1",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 3000,
                    isDisbursement: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
                {
                    id: "reimb2",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 2000,
                    isDisbursement: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const remaining = calculateAdvanceRemaining(advance);
        expect(remaining).toBe(5000); // 10000 - 3000 - 2000
    });

    it("should return full amount when no reimbursements", () => {
        const advance: Advance = {
            id: "adv1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            amount: 10000,
            status: AdvanceStatus.EN_COURS,
            reimbursements: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const remaining = calculateAdvanceRemaining(advance);
        expect(remaining).toBe(10000);
    });

    it("should return zero when fully reimbursed", () => {
        const advance: Advance = {
            id: "adv1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            amount: 10000,
            status: AdvanceStatus.REMBOURSE_TOTAL,
            reimbursements: [
                {
                    id: "reimb1",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 10000,
                    isDisbursement: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const remaining = calculateAdvanceRemaining(advance);
        expect(remaining).toBe(0);
    });
});

describe("determineAdvanceStatus", () => {
    it("should return EN_COURS when no reimbursements", () => {
        const advance: Advance = {
            id: "adv1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            amount: 10000,
            status: AdvanceStatus.EN_COURS,
            reimbursements: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const status = determineAdvanceStatus(advance);
        expect(status).toBe(AdvanceStatus.EN_COURS);
    });

    it("should return REMBOURSE_PARTIEL when partially reimbursed", () => {
        const advance: Advance = {
            id: "adv1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            amount: 10000,
            status: AdvanceStatus.EN_COURS,
            reimbursements: [
                {
                    id: "reimb1",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 5000,
                    isDisbursement: false,
                    advanceId: "adv1",
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const status = determineAdvanceStatus(advance);
        expect(status).toBe(AdvanceStatus.REMBOURSE_PARTIEL);
    });

    it("should return REMBOURSE_TOTAL when fully reimbursed", () => {
        const advance: Advance = {
            id: "adv1",
            tenantId: "tenant1",
            mouvementId: "mov1",
            intervenantId: "int1",
            amount: 10000,
            status: AdvanceStatus.EN_COURS,
            reimbursements: [
                {
                    id: "reimb1",
                    tenantId: "tenant1",
                    date: new Date(),
                    intervenantId: "int1",
                    type: MouvementType.ENTREE,
                    amount: 10000,
                    isDisbursement: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                },
            ],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const status = determineAdvanceStatus(advance);
        expect(status).toBe(AdvanceStatus.REMBOURSE_TOTAL);
    });
});
