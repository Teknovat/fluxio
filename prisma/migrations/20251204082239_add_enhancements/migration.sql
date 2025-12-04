-- CreateTable
CREATE TABLE "Advance" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "mouvementId" TEXT NOT NULL,
    "intervenantId" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "dueDate" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'EN_COURS',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Advance_mouvementId_fkey" FOREIGN KEY ("mouvementId") REFERENCES "Mouvement" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Advance_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "Intervenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CashReconciliation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "theoreticalBalance" REAL NOT NULL,
    "physicalCount" REAL NOT NULL,
    "gap" REAL NOT NULL,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CashReconciliation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "relatedId" TEXT,
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" DATETIME,
    "dismissedBy" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "debtThreshold" REAL NOT NULL DEFAULT 10000,
    "minCashBalance" REAL NOT NULL DEFAULT 5000,
    "reconciliationGapThreshold" REAL NOT NULL DEFAULT 500,
    "defaultAdvanceDueDays" INTEGER NOT NULL DEFAULT 30,
    "companyName" TEXT NOT NULL DEFAULT 'Fluxio',
    "companyLogo" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'XAF',
    "alertsEnabled" BOOLEAN NOT NULL DEFAULT true,
    "categoriesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "advancesEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Mouvement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "intervenantId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" REAL NOT NULL,
    "reference" TEXT,
    "modality" TEXT,
    "category" TEXT,
    "note" TEXT,
    "isAdvance" BOOLEAN NOT NULL DEFAULT false,
    "advanceId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Mouvement_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Mouvement_intervenantId_fkey" FOREIGN KEY ("intervenantId") REFERENCES "Intervenant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Mouvement_advanceId_fkey" FOREIGN KEY ("advanceId") REFERENCES "Advance" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Mouvement" ("amount", "createdAt", "date", "id", "intervenantId", "modality", "note", "reference", "tenantId", "type", "updatedAt") SELECT "amount", "createdAt", "date", "id", "intervenantId", "modality", "note", "reference", "tenantId", "type", "updatedAt" FROM "Mouvement";
DROP TABLE "Mouvement";
ALTER TABLE "new_Mouvement" RENAME TO "Mouvement";
CREATE INDEX "Mouvement_tenantId_idx" ON "Mouvement"("tenantId");
CREATE INDEX "Mouvement_tenantId_date_idx" ON "Mouvement"("tenantId", "date");
CREATE INDEX "Mouvement_tenantId_intervenantId_idx" ON "Mouvement"("tenantId", "intervenantId");
CREATE INDEX "Mouvement_tenantId_type_idx" ON "Mouvement"("tenantId", "type");
CREATE INDEX "Mouvement_tenantId_category_idx" ON "Mouvement"("tenantId", "category");
CREATE INDEX "Mouvement_date_idx" ON "Mouvement"("date");
CREATE INDEX "Mouvement_intervenantId_idx" ON "Mouvement"("intervenantId");
CREATE INDEX "Mouvement_type_idx" ON "Mouvement"("type");
CREATE INDEX "Mouvement_advanceId_idx" ON "Mouvement"("advanceId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Advance_mouvementId_key" ON "Advance"("mouvementId");

-- CreateIndex
CREATE INDEX "Advance_tenantId_idx" ON "Advance"("tenantId");

-- CreateIndex
CREATE INDEX "Advance_tenantId_intervenantId_idx" ON "Advance"("tenantId", "intervenantId");

-- CreateIndex
CREATE INDEX "Advance_tenantId_status_idx" ON "Advance"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Advance_intervenantId_idx" ON "Advance"("intervenantId");

-- CreateIndex
CREATE INDEX "Advance_status_idx" ON "Advance"("status");

-- CreateIndex
CREATE INDEX "Advance_dueDate_idx" ON "Advance"("dueDate");

-- CreateIndex
CREATE INDEX "CashReconciliation_tenantId_idx" ON "CashReconciliation"("tenantId");

-- CreateIndex
CREATE INDEX "CashReconciliation_tenantId_date_idx" ON "CashReconciliation"("tenantId", "date");

-- CreateIndex
CREATE INDEX "CashReconciliation_date_idx" ON "CashReconciliation"("date");

-- CreateIndex
CREATE INDEX "Alert_tenantId_idx" ON "Alert"("tenantId");

-- CreateIndex
CREATE INDEX "Alert_tenantId_dismissed_idx" ON "Alert"("tenantId", "dismissed");

-- CreateIndex
CREATE INDEX "Alert_dismissed_idx" ON "Alert"("dismissed");

-- CreateIndex
CREATE INDEX "Alert_type_idx" ON "Alert"("type");

-- CreateIndex
CREATE INDEX "Alert_createdAt_idx" ON "Alert"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Settings_tenantId_key" ON "Settings"("tenantId");

-- CreateIndex
CREATE INDEX "Settings_tenantId_idx" ON "Settings"("tenantId");
