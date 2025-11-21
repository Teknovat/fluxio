# Fluxio - Cash Management System

A Next.js application for managing cash flow, intervenants, and users with role-based access control.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

1. Install dependencies:

```bash
npm install
```

2. Set up the database:

```bash
npm run db:push
npm run db:seed
```

3. Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

## Default Credentials

After seeding the database:

- Email: `admin@fluxio.com`
- Password: `admin123`

## Tech Stack

- Next.js 14+ (App Router)
- TypeScript
- Prisma ORM
- SQLite
- TailwindCSS
- JWT Authentication
- bcrypt
- Zod validation
