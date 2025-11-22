# Configuration Base de Données

Ce projet utilise **SQLite** en développement local et **PostgreSQL** en production (Vercel).

## Développement Local (SQLite)

### Configuration initiale

1. Assurez-vous que votre `.env` contient:

```env
DATABASE_URL="file:./dev.db"
```

2. Basculer vers SQLite (si nécessaire):

```bash
npm run db:sqlite
```

3. Créer/mettre à jour la base de données:

```bash
npm run db:push
```

4. Peupler la base avec des données de test:

```bash
npm run db:seed
```

## Production (PostgreSQL sur Vercel)

### Configuration Vercel

1. Dans votre projet Vercel, ajoutez la variable d'environnement:

```
DATABASE_URL=postgresql://user:password@host:5432/database?schema=public
```

2. Le schema Prisma est déjà configuré pour PostgreSQL par défaut

3. Vercel exécutera automatiquement `prisma generate` lors du build

### Migration vers PostgreSQL

Si vous avez besoin de tester PostgreSQL en local:

1. Installez PostgreSQL localement ou utilisez Docker:

```bash
docker run --name fluxio-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=fluxio -p 5432:5432 -d postgres
```

2. Mettez à jour votre `.env`:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/fluxio?schema=public"
```

3. Basculer vers PostgreSQL:

```bash
npm run db:postgres
```

4. Créer/mettre à jour la base de données:

```bash
npm run db:push
npm run db:seed
```

## Commandes Utiles

| Commande              | Description                                          |
| --------------------- | ---------------------------------------------------- |
| `npm run db:sqlite`   | Bascule vers SQLite et régénère le client Prisma     |
| `npm run db:postgres` | Bascule vers PostgreSQL et régénère le client Prisma |
| `npm run db:push`     | Synchronise le schema avec la base de données        |
| `npm run db:seed`     | Peuple la base avec des données de test              |

## Notes Importantes

- **Ne commitez jamais** votre fichier `.env` (il est dans `.gitignore`)
- Le fichier `prisma/schema.prisma` est configuré pour **PostgreSQL** par défaut
- Utilisez `npm run db:sqlite` pour développer en local avec SQLite
- En production, Vercel utilisera automatiquement PostgreSQL via la variable d'environnement

## Différences SQLite vs PostgreSQL

Les deux bases sont compatibles pour ce projet car:

- Nous utilisons des types de données simples (String, Float, DateTime, Boolean)
- Pas d'utilisation de fonctionnalités spécifiques à PostgreSQL
- Les enums sont stockés comme String pour la compatibilité

Si vous ajoutez des fonctionnalités avancées, vérifiez la compatibilité entre les deux bases.
