-- PostgreSQL Migration for Multi-Tenancy
-- This migration adds multi-tenancy support and creates a default tenant for existing data

-- CreateTable Tenant
CREATE TABLE IF NOT EXISTS "Tenant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "subdomain" TEXT UNIQUE,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "logo" TEXT,
    "primaryColor" TEXT DEFAULT '#3b82f6',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create default tenant for existing data
INSERT INTO "Tenant" ("id", "name", "slug", "active", "createdAt", "updatedAt")
VALUES ('default-tenant-id', 'Default Company', 'default', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT ("slug") DO NOTHING;

-- Add tenantId column to User table (nullable first)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Set default tenant for existing users
UPDATE "User" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;

-- Make tenantId required and add foreign key
ALTER TABLE "User" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "User" ADD CONSTRAINT "User_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add tenantId column to Intervenant table (nullable first)
ALTER TABLE "Intervenant" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;
ALTER TABLE "Intervenant" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Set default tenant for existing intervenants
UPDATE "Intervenant" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;

-- Make tenantId required and add foreign key
ALTER TABLE "Intervenant" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Intervenant" ADD CONSTRAINT "Intervenant_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add tenantId column to Mouvement table (nullable first)
ALTER TABLE "Mouvement" ADD COLUMN IF NOT EXISTS "tenantId" TEXT;

-- Set default tenant for existing mouvements
UPDATE "Mouvement" SET "tenantId" = 'default-tenant-id' WHERE "tenantId" IS NULL;

-- Make tenantId required and add foreign key
ALTER TABLE "Mouvement" ALTER COLUMN "tenantId" SET NOT NULL;
ALTER TABLE "Mouvement" ADD CONSTRAINT "Mouvement_tenantId_fkey" 
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Update User email unique constraint to be per-tenant
ALTER TABLE "User" DROP CONSTRAINT IF EXISTS "User_email_key";
CREATE UNIQUE INDEX IF NOT EXISTS "User_tenantId_email_key" ON "User"("tenantId", "email");

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_slug_key" ON "Tenant"("slug");
CREATE UNIQUE INDEX IF NOT EXISTS "Tenant_subdomain_key" ON "Tenant"("subdomain");
CREATE INDEX IF NOT EXISTS "Tenant_slug_idx" ON "Tenant"("slug");
CREATE INDEX IF NOT EXISTS "Tenant_active_idx" ON "Tenant"("active");

CREATE INDEX IF NOT EXISTS "User_tenantId_idx" ON "User"("tenantId");
CREATE INDEX IF NOT EXISTS "User_email_idx" ON "User"("email");

CREATE INDEX IF NOT EXISTS "Intervenant_tenantId_idx" ON "Intervenant"("tenantId");
CREATE INDEX IF NOT EXISTS "Intervenant_tenantId_type_idx" ON "Intervenant"("tenantId", "type");

CREATE INDEX IF NOT EXISTS "Mouvement_tenantId_idx" ON "Mouvement"("tenantId");
CREATE INDEX IF NOT EXISTS "Mouvement_tenantId_date_idx" ON "Mouvement"("tenantId", "date");
CREATE INDEX IF NOT EXISTS "Mouvement_tenantId_intervenantId_idx" ON "Mouvement"("tenantId", "intervenantId");
CREATE INDEX IF NOT EXISTS "Mouvement_tenantId_type_idx" ON "Mouvement"("tenantId", "type");
