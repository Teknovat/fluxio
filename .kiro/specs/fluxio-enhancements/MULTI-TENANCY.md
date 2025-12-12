# Multi-Tenancy Design - Fluxio

## Vue d'Ensemble

Le système Fluxio sera transformé en une application multi-tenant permettant à plusieurs entreprises d'utiliser la même instance de l'application tout en gardant leurs données complètement isolées.

## Architecture Multi-Tenant

### Modèle de Données

```prisma
// Nouveau modèle Tenant
model Tenant {
  id            String   @id @default(cuid())
  name          String   // Nom de l'entreprise
  slug          String   @unique // URL-friendly identifier
  subdomain     String?  @unique // Optional subdomain
  active        Boolean  @default(true)
  logo          String?
  primaryColor  String?  @default("#3b82f6")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  users         User[]
  intervenants  Intervenant[]
  mouvements    Mouvement[]
  advances      Advance[]
  reconciliations CashReconciliation[]
  alerts        Alert[]
  settings      Settings?

  @@index([slug])
  @@index([active])
}

// Mise à jour des modèles existants
model User {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ... autres champs existants ...

  @@index([tenantId])
  @@unique([tenantId, email]) // Email unique par tenant
}

model Intervenant {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ... autres champs existants ...

  @@index([tenantId])
}

model Mouvement {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ... autres champs existants ...

  @@index([tenantId])
  @@index([tenantId, date])
}

model Advance {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ... autres champs existants ...

  @@index([tenantId])
}

model CashReconciliation {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ... autres champs existants ...

  @@index([tenantId])
}

model Alert {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ... autres champs existants ...

  @@index([tenantId])
}

model Settings {
  id        String   @id @default(cuid())
  tenantId  String   @unique
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  // ... autres champs existants ...
}
```

## Stratégies d'Isolation

### 1. Isolation par Tenant ID (Recommandé)

Chaque requête inclut automatiquement le `tenantId` dans le filtre.

```typescript
// lib/tenant.ts

export async function getTenantFromRequest(request: Request): Promise<string> {
  // Option 1: Subdomain (company-abc.fluxio.com)
  const host = request.headers.get("host");
  const subdomain = host?.split(".")[0];

  if (subdomain && subdomain !== "www" && subdomain !== "fluxio") {
    const tenant = await prisma.tenant.findUnique({
      where: { subdomain },
      select: { id: true, active: true },
    });

    if (tenant && tenant.active) {
      return tenant.id;
    }
  }

  // Option 2: Path-based (fluxio.com/company-abc)
  const url = new URL(request.url);
  const slug = url.pathname.split("/")[1];

  if (slug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, active: true },
    });

    if (tenant && tenant.active) {
      return tenant.id;
    }
  }

  // Option 3: From JWT token
  const token = request.cookies.get("auth-token");
  if (token) {
    const payload = await verifyToken(token.value);
    return payload.tenantId;
  }

  throw new Error("Tenant not found");
}

// Middleware pour toutes les requêtes API
export async function withTenant<T>(request: Request, handler: (tenantId: string) => Promise<T>): Promise<T> {
  const tenantId = await getTenantFromRequest(request);
  return handler(tenantId);
}
```

### 2. Prisma Middleware pour Auto-Filtrage

```typescript
// lib/prisma.ts

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Middleware pour ajouter automatiquement tenantId
prisma.$use(async (params, next) => {
  // Récupérer le tenantId du contexte (AsyncLocalStorage)
  const tenantId = getTenantIdFromContext();

  if (!tenantId) {
    throw new Error("Tenant context not set");
  }

  // Modèles qui nécessitent tenant isolation
  const tenantModels = ["User", "Intervenant", "Mouvement", "Advance", "CashReconciliation", "Alert", "Settings"];

  if (tenantModels.includes(params.model || "")) {
    // Ajouter tenantId aux queries
    if (params.action === "findMany" || params.action === "findFirst") {
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }

    // Ajouter tenantId aux créations
    if (params.action === "create") {
      params.args.data = {
        ...params.args.data,
        tenantId,
      };
    }

    // Ajouter tenantId aux updates
    if (params.action === "update" || params.action === "updateMany") {
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }

    // Ajouter tenantId aux deletes
    if (params.action === "delete" || params.action === "deleteMany") {
      params.args.where = {
        ...params.args.where,
        tenantId,
      };
    }
  }

  return next(params);
});

export { prisma };
```

## Authentification Multi-Tenant

### JWT Token avec Tenant ID

```typescript
// lib/auth.ts

export interface JWTPayload {
  userId: string;
  email: string;
  role: Role;
  tenantId: string; // Nouveau champ
  tenantSlug: string; // Pour redirection
}

export async function generateToken(user: User, tenant: Tenant): Promise<string> {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
  };

  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: "24h" });
}
```

### Login Multi-Tenant

```typescript
// app/api/auth/login/route.ts

export async function POST(request: NextRequest) {
  const { email, password, tenantSlug } = await request.json();

  // 1. Trouver le tenant
  const tenant = await prisma.tenant.findUnique({
    where: { slug: tenantSlug, active: true },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  // 2. Trouver l'utilisateur dans ce tenant
  const user = await prisma.user.findUnique({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email,
      },
    },
  });

  if (!user || !user.active) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 3. Vérifier le mot de passe
  const valid = await comparePassword(password, user.password);

  if (!valid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  // 4. Générer le token avec tenantId
  const token = await generateToken(user, tenant);

  // 5. Retourner le token
  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      tenantId: tenant.id,
      tenantName: tenant.name,
    },
    token,
  });
}
```

## Enregistrement de Nouveau Tenant

### API d'Enregistrement

```typescript
// app/api/tenants/register/route.ts

export async function POST(request: NextRequest) {
  const { companyName, adminName, adminEmail, password } = await request.json();

  // 1. Générer un slug unique
  const slug = generateSlug(companyName);

  // 2. Vérifier que le slug n'existe pas
  const existing = await prisma.tenant.findUnique({ where: { slug } });

  if (existing) {
    return NextResponse.json({ error: "Company name already taken" }, { status: 409 });
  }

  // 3. Créer le tenant et l'admin en transaction
  const result = await prisma.$transaction(async (tx) => {
    // Créer le tenant
    const tenant = await tx.tenant.create({
      data: {
        name: companyName,
        slug,
        active: true,
      },
    });

    // Créer les settings par défaut
    await tx.settings.create({
      data: {
        tenantId: tenant.id,
        debtThreshold: 10000,
        minCashBalance: 5000,
        reconciliationGapThreshold: 500,
        defaultAdvanceDueDays: 30,
        companyName,
        currency: "TND",
        alertsEnabled: true,
        categoriesEnabled: true,
        advancesEnabled: true,
      },
    });

    // Créer l'utilisateur admin
    const hashedPassword = await hashPassword(password);
    const admin = await tx.user.create({
      data: {
        tenantId: tenant.id,
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "ADMIN",
        active: true,
      },
    });

    return { tenant, admin };
  });

  // 4. Générer le token
  const token = await generateToken(result.admin, result.tenant);

  // 5. Retourner les infos
  return NextResponse.json(
    {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
      },
      user: {
        id: result.admin.id,
        name: result.admin.name,
        email: result.admin.email,
        role: result.admin.role,
      },
      token,
    },
    { status: 201 }
  );
}

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
```

## Gestion des Tenants (Super Admin)

### Super Admin Role

```typescript
enum Role {
  SUPER_ADMIN  // Nouveau rôle
  ADMIN
  USER
}

// Middleware pour super admin
export async function requireSuperAdmin(request: Request): Promise<JWTPayload> {
  const user = await requireAuth(request);

  if (user.role !== 'SUPER_ADMIN') {
    throw new Error('Forbidden: Super admin access required');
  }

  return user;
}
```

### API de Gestion des Tenants

```typescript
// app/api/admin/tenants/route.ts

// Liste tous les tenants (Super Admin only)
export async function GET(request: NextRequest) {
  await requireSuperAdmin(request);

  const tenants = await prisma.tenant.findMany({
    include: {
      _count: {
        select: {
          users: true,
          mouvements: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tenants);
}

// Désactiver un tenant
export async function PATCH(request: NextRequest) {
  await requireSuperAdmin(request);

  const { tenantId, active } = await request.json();

  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: { active },
  });

  return NextResponse.json(tenant);
}
```

## Routing Multi-Tenant

### Option 1: Subdomain-based

```
company-abc.fluxio.com → Tenant: company-abc
company-xyz.fluxio.com → Tenant: company-xyz
```

Configuration Next.js:

```typescript
// next.config.js
module.exports = {
  async rewrites() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "(?<tenant>.*)\\.fluxio\\.com",
          },
        ],
        destination: "/:path*",
      },
    ];
  },
};
```

### Option 2: Path-based (Plus Simple)

```
fluxio.com/company-abc → Tenant: company-abc
fluxio.com/company-xyz → Tenant: company-xyz
```

## Branding par Tenant

```typescript
// app/(dashboard)/layout.tsx

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tenantId = await getTenantId();

  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      name: true,
      logo: true,
      primaryColor: true,
    },
  });

  return (
    <html>
      <head>
        <style>{`
          :root {
            --primary-color: ${tenant?.primaryColor || "#3b82f6"};
          }
        `}</style>
      </head>
      <body>
        <nav>
          {tenant?.logo && <img src={tenant.logo} alt={tenant.name} />}
          <span>{tenant?.name}</span>
        </nav>
        {children}
      </body>
    </html>
  );
}
```

## Migration des Données Existantes

```typescript
// scripts/migrate-to-multi-tenant.ts

async function migrateToMultiTenant() {
  // 1. Créer un tenant par défaut
  const defaultTenant = await prisma.tenant.create({
    data: {
      name: "Default Company",
      slug: "default",
      active: true,
    },
  });

  // 2. Associer tous les utilisateurs existants au tenant par défaut
  await prisma.user.updateMany({
    data: {
      tenantId: defaultTenant.id,
    },
  });

  // 3. Associer tous les intervenants
  await prisma.intervenant.updateMany({
    data: {
      tenantId: defaultTenant.id,
    },
  });

  // 4. Associer tous les mouvements
  await prisma.mouvement.updateMany({
    data: {
      tenantId: defaultTenant.id,
    },
  });

  // ... etc pour tous les modèles

  console.log("Migration completed!");
}
```

## Sécurité

### Checklist de Sécurité Multi-Tenant

- ✅ Tous les modèles ont un `tenantId`
- ✅ Tous les queries filtrent par `tenantId`
- ✅ JWT contient le `tenantId`
- ✅ Middleware vérifie le `tenantId`
- ✅ Pas de requêtes cross-tenant possibles
- ✅ Isolation au niveau de la base de données
- ✅ Tests de sécurité pour vérifier l'isolation
- ✅ Audit logs pour toutes les opérations

## Performance

### Optimisations

1. **Index sur tenantId** : Tous les modèles ont un index sur `tenantId`
2. **Caching par tenant** : Cache séparé pour chaque tenant
3. **Connection pooling** : Pool de connexions par tenant si nécessaire
4. **Lazy loading** : Charger les données tenant uniquement quand nécessaire

## Tests

### Tests d'Isolation

```typescript
describe("Multi-Tenant Isolation", () => {
  it("should not allow access to other tenant data", async () => {
    const tenant1 = await createTenant("Company A");
    const tenant2 = await createTenant("Company B");

    const user1 = await createUser(tenant1.id);
    const user2 = await createUser(tenant2.id);

    // User 1 ne doit pas voir les données de User 2
    const token1 = await generateToken(user1, tenant1);
    const response = await fetch("/api/mouvements", {
      headers: { Authorization: `Bearer ${token1}` },
    });

    const data = await response.json();

    // Vérifier que seules les données du tenant 1 sont retournées
    expect(data.every((m) => m.tenantId === tenant1.id)).toBe(true);
  });
});
```

## Déploiement

### Variables d'Environnement

```env
# Multi-tenancy
MULTI_TENANT_ENABLED=true
DEFAULT_TENANT_SLUG=default
ALLOW_TENANT_REGISTRATION=true

# Super Admin
SUPER_ADMIN_EMAIL=admin@fluxio.com
SUPER_ADMIN_PASSWORD=super-secure-password
```

## Estimation

**Effort d'implémentation** : 5-7 jours

- Schéma DB et migrations : 1 jour
- Middleware et isolation : 2 jours
- API d'enregistrement : 1 jour
- UI et branding : 1-2 jours
- Tests et sécurité : 1-2 jours

**Impact sur les phases existantes** :

- Phase 1 : +2 jours (ajout multi-tenancy)
- Autres phases : Pas d'impact majeur (juste ajouter tenantId)
