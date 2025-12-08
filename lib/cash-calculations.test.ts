import { describe, it, expect, beforeEach, vi } from "vitest";
import {
    calculateCurrentCashBalance,
    calculateCashBalanceTrend,
    getTodayCashSummary,
    getRecentCashMovements,
} from "./cash-calculations";
import { MouvementType, Modality } from "@/types";

// Mock Prisma Client
const createMockPrisma = () => {
    return {
        mouvement: {
            findMany: vi.fn(),
        },
    } as any;
};

describe("calculateCurrentCashBalance", () => {
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = createMockPrisma();
    });

    it("should calculate balance with mixed movements", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.SORTIE,
                amount: 300,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov3",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 500,
                modality: Modality.ESPECES,
                date: new Date(),
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const balance = await calculateCurrentCashBalance(mockPrisma, "tenant1");

        expect(balance).toBe(1200); // 1000 + 500 - 300
        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith({
            where: {
                tenantId: "tenant1",
                modality: Modality.ESPECES,
            },
        });
    });

    it("should return zero when no movements", async () => {
        mockPrisma.mouvement.findMany.mockResolvedValue([]);

        const balance = await calculateCurrentCashBalance(mockPrisma, "tenant1");

        expect(balance).toBe(0);
    });

    it("should only include ESPECES modality", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 500,
                modality: Modality.CHEQUE, // Should be excluded
                date: new Date(),
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue([movements[0]]);

        const balance = await calculateCurrentCashBalance(mockPrisma, "tenant1");

        expect(balance).toBe(1000); // Only ESPECES movement
    });

    it("should handle only inflows", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 500,
                modality: Modality.ESPECES,
                date: new Date(),
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const balance = await calculateCurrentCashBalance(mockPrisma, "tenant1");

        expect(balance).toBe(1500);
    });

    it("should handle only outflows", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.SORTIE,
                amount: 300,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.SORTIE,
                amount: 200,
                modality: Modality.ESPECES,
                date: new Date(),
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const balance = await calculateCurrentCashBalance(mockPrisma, "tenant1");

        expect(balance).toBe(-500); // Negative balance
    });
});

describe("calculateCashBalanceTrend", () => {
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = createMockPrisma();
    });

    it("should calculate balance trend over 30 days", async () => {
        const today = new Date();
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.SORTIE,
                amount: 300,
                modality: Modality.ESPECES,
                date: new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const trend = await calculateCashBalanceTrend(mockPrisma, "tenant1", 30);

        expect(trend).toHaveLength(30);
        expect(trend[0]).toHaveProperty("date");
        expect(trend[0]).toHaveProperty("balance");
        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    tenantId: "tenant1",
                    modality: Modality.ESPECES,
                    date: expect.objectContaining({
                        gte: expect.any(Date),
                        lte: expect.any(Date),
                    }),
                }),
                orderBy: { date: "asc" },
            })
        );
    });

    it("should calculate running balance correctly", async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const day1 = new Date(today);
        day1.setDate(day1.getDate() - 2);

        const day2 = new Date(today);
        day2.setDate(day2.getDate() - 1);

        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: day1,
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.SORTIE,
                amount: 300,
                modality: Modality.ESPECES,
                date: day2,
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const trend = await calculateCashBalanceTrend(mockPrisma, "tenant1", 3);

        expect(trend).toHaveLength(3);
        // Day 0 (2 days ago): +1000 = 1000
        expect(trend[0].balance).toBe(1000);
        // Day 1 (1 day ago): -300 = 700
        expect(trend[1].balance).toBe(700);
        // Day 2 (today): no movements = 700
        expect(trend[2].balance).toBe(700);
    });

    it("should handle days with no movements", async () => {
        mockPrisma.mouvement.findMany.mockResolvedValue([]);

        const trend = await calculateCashBalanceTrend(mockPrisma, "tenant1", 7);

        expect(trend).toHaveLength(7);
        // All days should have balance 0
        trend.forEach((day) => {
            expect(day.balance).toBe(0);
        });
    });

    it("should filter by ESPECES modality only", async () => {
        const today = new Date();
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: today,
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        await calculateCashBalanceTrend(mockPrisma, "tenant1", 7);

        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    modality: Modality.ESPECES,
                }),
            })
        );
    });
});

describe("getTodayCashSummary", () => {
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = createMockPrisma();
    });

    it("should calculate today's summary with mixed movements", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.SORTIE,
                amount: 300,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov3",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 500,
                modality: Modality.ESPECES,
                date: new Date(),
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const summary = await getTodayCashSummary(mockPrisma, "tenant1");

        expect(summary.inflows).toBe(1500); // 1000 + 500
        expect(summary.outflows).toBe(300);
        expect(summary.net).toBe(1200); // 1500 - 300
        expect(summary.count).toBe(3);
    });

    it("should return zeros when no movements today", async () => {
        mockPrisma.mouvement.findMany.mockResolvedValue([]);

        const summary = await getTodayCashSummary(mockPrisma, "tenant1");

        expect(summary.inflows).toBe(0);
        expect(summary.outflows).toBe(0);
        expect(summary.net).toBe(0);
        expect(summary.count).toBe(0);
    });

    it("should only include today's movements", async () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        mockPrisma.mouvement.findMany.mockResolvedValue([]);

        await getTodayCashSummary(mockPrisma, "tenant1");

        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith({
            where: {
                tenantId: "tenant1",
                modality: Modality.ESPECES,
                date: { gte: today },
            },
        });
    });

    it("should filter by ESPECES modality", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: new Date(),
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        await getTodayCashSummary(mockPrisma, "tenant1");

        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    modality: Modality.ESPECES,
                }),
            })
        );
    });

    it("should handle only inflows", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 500,
                modality: Modality.ESPECES,
                date: new Date(),
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const summary = await getTodayCashSummary(mockPrisma, "tenant1");

        expect(summary.inflows).toBe(1500);
        expect(summary.outflows).toBe(0);
        expect(summary.net).toBe(1500);
    });

    it("should handle only outflows", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.SORTIE,
                amount: 300,
                modality: Modality.ESPECES,
                date: new Date(),
            },
            {
                id: "mov2",
                tenantId: "tenant1",
                type: MouvementType.SORTIE,
                amount: 200,
                modality: Modality.ESPECES,
                date: new Date(),
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const summary = await getTodayCashSummary(mockPrisma, "tenant1");

        expect(summary.inflows).toBe(0);
        expect(summary.outflows).toBe(500);
        expect(summary.net).toBe(-500);
    });
});

describe("getRecentCashMovements", () => {
    let mockPrisma: any;

    beforeEach(() => {
        mockPrisma = createMockPrisma();
    });

    it("should return recent movements with default limit", async () => {
        const movements = Array.from({ length: 25 }, (_, i) => ({
            id: `mov${i}`,
            tenantId: "tenant1",
            type: i % 2 === 0 ? MouvementType.ENTREE : MouvementType.SORTIE,
            amount: 100 * (i + 1),
            modality: Modality.ESPECES,
            date: new Date(),
            intervenant: {
                id: `int${i}`,
                name: `Intervenant ${i}`,
            },
        }));

        mockPrisma.mouvement.findMany.mockResolvedValue(movements.slice(0, 20));

        const result = await getRecentCashMovements(mockPrisma, "tenant1");

        expect(result).toHaveLength(20);
        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith({
            where: {
                tenantId: "tenant1",
                modality: Modality.ESPECES,
            },
            include: {
                intervenant: true,
            },
            orderBy: { date: "desc" },
            take: 20,
        });
    });

    it("should respect custom limit", async () => {
        const movements = Array.from({ length: 10 }, (_, i) => ({
            id: `mov${i}`,
            tenantId: "tenant1",
            type: MouvementType.ENTREE,
            amount: 100,
            modality: Modality.ESPECES,
            date: new Date(),
            intervenant: {
                id: `int${i}`,
                name: `Intervenant ${i}`,
            },
        }));

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const result = await getRecentCashMovements(mockPrisma, "tenant1", 10);

        expect(result).toHaveLength(10);
        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                take: 10,
            })
        );
    });

    it("should filter by ESPECES modality", async () => {
        mockPrisma.mouvement.findMany.mockResolvedValue([]);

        await getRecentCashMovements(mockPrisma, "tenant1");

        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({
                    modality: Modality.ESPECES,
                }),
            })
        );
    });

    it("should include intervenant data", async () => {
        const movements = [
            {
                id: "mov1",
                tenantId: "tenant1",
                type: MouvementType.ENTREE,
                amount: 1000,
                modality: Modality.ESPECES,
                date: new Date(),
                intervenant: {
                    id: "int1",
                    name: "John Doe",
                    type: "CLIENT",
                },
            },
        ];

        mockPrisma.mouvement.findMany.mockResolvedValue(movements);

        const result = await getRecentCashMovements(mockPrisma, "tenant1");

        expect(result[0].intervenant).toBeDefined();
        expect(result[0].intervenant?.name).toBe("John Doe");
    });

    it("should order by date descending", async () => {
        mockPrisma.mouvement.findMany.mockResolvedValue([]);

        await getRecentCashMovements(mockPrisma, "tenant1");

        expect(mockPrisma.mouvement.findMany).toHaveBeenCalledWith(
            expect.objectContaining({
                orderBy: { date: "desc" },
            })
        );
    });
});
