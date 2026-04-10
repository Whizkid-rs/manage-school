# School Manager

Private school management web app for administrators, professors, and students. Role-based access to professors, courses, student records, and payments.

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | PostgreSQL via Prisma 7 (Neon serverless) |
| Auth | NextAuth v4 — JWT + CredentialsProvider |
| UI | Tailwind CSS + shadcn/ui |
| Validation | Zod v4 + react-hook-form |
| Tests | Playwright |

## Prerequisites

- Node 20 (`nvm use 20`)
- A PostgreSQL database — [Neon](https://neon.tech) free tier works

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local
cp .env.local.example .env.local   # or create manually
```

`.env.local` needs:

```env
DATABASE_URL=postgresql://...      # Neon connection string (use ?sslmode=require)
NEXTAUTH_SECRET=any-random-string
NEXTAUTH_URL=http://localhost:3000
```

```bash
# 3. Run migrations
npx prisma migrate dev

# 4. Seed the database
npx prisma db seed
```

## Running

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/login`.

## Seed Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123 |
| Professor | john.smith@school.com | prof123 |
| Professor | maria.garcia@school.com | prof123 |
| Student | alice@student.com | student123 |
| Student | bob@student.com | student123 |
| Student | carol@student.com | student123 |
| Student | david@student.com | student123 |
| Student | eve@student.com | student123 |

## Running Tests

The Playwright test suite spins up the dev server automatically:

```bash
npx playwright test
```

To run a specific spec:

```bash
npx playwright test tests/payments.spec.ts
```

Tests use stored auth states in `tests/fixtures/` (generated on first run by `tests/auth.setup.ts`). The database must be seeded before running tests.

## Module Access by Role

| Module | Admin | Professor | Student |
|--------|-------|-----------|---------|
| Dashboard | KPI cards + group payment status + overdue invoices | Assigned courses | Active courses + balance |
| Professors | Full CRUD | View own profile | — |
| Courses | Full CRUD + enroll/drop | View assigned | View enrolled |
| Groups | Full CRUD + members + courses | — | View own group |
| Payments | Full CRUD + generate monthly invoices | — (blocked) | View own |
| Students | Full CRUD | — | — |

## Project Structure

```
├── features/                  # Module documentation + ERD
├── prisma/
│   ├── schema.prisma          # All models: User, Professor, Course, Student, Group, Payment, Enrollment, …
│   └── seed.ts                # Dev seed data (2 professors, 3 courses, 2 groups, 5 students, 5 invoices)
├── src/
│   ├── app/
│   │   ├── (auth)/login/      # Login page
│   │   ├── (dashboard)/       # All protected routes
│   │   │   ├── layout.tsx     # Sidebar + TopNav shell
│   │   │   ├── dashboard/     # Role-aware home page
│   │   │   ├── professors/    # List, new, detail, edit
│   │   │   ├── courses/       # List, new, detail, edit, enroll
│   │   │   ├── groups/        # List, new, detail, edit, add-member, add-course
│   │   │   ├── students/      # List, new, detail, edit
│   │   │   └── payments/      # List, new, detail
│   │   └── api/               # REST handlers (auth + all modules)
│   │       ├── groups/        # CRUD + /members + /courses sub-routes
│   │       └── invoices/generate/  # Monthly invoice generation
│   ├── components/
│   │   ├── layout/            # Sidebar, TopNav, RoleGuard
│   │   ├── groups/            # RemoveMemberButton, RemoveCourseButton
│   │   ├── payments/          # OverdueBadge, GenerateInvoicesButton
│   │   └── ui/                # shadcn/ui + SearchInput
│   ├── lib/
│   │   ├── prisma.ts          # Prisma client singleton (pg adapter)
│   │   ├── auth.ts            # NextAuth config
│   │   └── utils.ts           # cn(), formatCurrency(), formatDate()
│   ├── proxy.ts               # Route protection middleware (renamed from middleware.ts in Next.js 16)
│   └── types/next-auth.d.ts   # Augmented session with role, professorId, studentId
└── tests/
    ├── auth.setup.ts          # Generates fixture storage states
    ├── fixtures/              # Saved auth sessions per role
    └── *.spec.ts              # One spec file per module
```

## Key Behaviours

- **OVERDUE** is computed on-read: a `PENDING` payment past its `dueDate` displays as OVERDUE. The database always stores the raw status.
- **Invoice numbers** are auto-generated on creation: `INV-YYYYMMDD-XXXX`.
- **Professors** cannot access the payments module at all (middleware redirect).
- **Students** see only their own payments and are blocked from the students admin list.
- Search on list pages is server-side via `searchParams` — no client-side filtering.
