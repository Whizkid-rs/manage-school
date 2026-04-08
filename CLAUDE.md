@AGENTS.md

# Project: Private School Management App

Next.js 16 App Router · Prisma 7 · NextAuth v4 · shadcn/ui · Zod v4 · PostgreSQL (Neon)

---

## Runtime / Tooling

- Node 20 via nvm: `source ~/.nvm/nvm.sh && nvm use 20` before any npm/npx command
- Prisma adapter: `@prisma/adapter-pg` + `pg.Pool` (Neon requires this, not the default engine)
- Middleware file is `src/proxy.ts` (Next.js 16 renamed it from `middleware.ts`)
- Run dev: `npm run dev` — app is on `http://localhost:3000`
- Run tests: `npx playwright test` (always from project root)

---

## Zod v4 + react-hook-form

`z.coerce.number()` infers `unknown` as input type in Zod v4. This breaks `zodResolver` type checking.

**Pattern — always use explicit TypeScript types for forms with coerced fields:**
```ts
// ❌ breaks — credits inferred as unknown
export type FormData = z.infer<typeof schema>

// ✅ correct — explicit type
export type FormData = {
  credits: number
  // ...
}
```

**Cast the resolver:**
```ts
import { type Resolver } from "react-hook-form"
resolver: zodResolver(schema) as Resolver<FormData>
```

Also: Zod v4 uses `parsed.error.issues` (not deprecated `.flatten()`).

---

## Prisma

```ts
// src/lib/prisma.ts — singleton with pg adapter
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient } from "@prisma/client"
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
export const prisma = new PrismaClient({ adapter } as any)
```

---

## Auth

- Strategy: JWT, CredentialsProvider, bcryptjs
- Session: `getServerSession(authOptions)` in server components
- Session has `user.role` (`ADMIN | PROFESSOR | STUDENT`), `user.professorId`, `user.studentId`
- Role checks in API routes: return 401 if no session, 403 if wrong role
- `src/proxy.ts` protects dashboard routes; admin-only paths redirect non-admins to `/dashboard`; professors blocked from `/payments`

---

## shadcn/ui patterns

- Use `buttonVariants()` on `<Link>` — no `asChild` prop needed
- shadcn Select: use `onValueChange` to call `setValue()` from react-hook-form (not register)
- All forms: add `noValidate` attribute to prevent browser validation

---

## Payment OVERDUE logic

OVERDUE is **computed on-read**, not stored. The DB stores `PENDING`.

```ts
function computeStatus(status: string, dueDate: Date) {
  if (status === "PENDING" && new Date(dueDate) < new Date()) return "OVERDUE"
  return status
}
```

This helper runs in both API routes and page server components.

---

## Role-based access summary

| Module    | ADMIN       | PROFESSOR        | STUDENT          |
|-----------|-------------|------------------|------------------|
| Dashboard | Full KPIs   | Own courses      | Own courses+pay  |
| Professors| CRUD        | Own profile only | —                |
| Courses   | CRUD+enroll | Assigned courses | Enrolled courses |
| Payments  | CRUD all    | Blocked          | Own only         |
| Students  | CRUD        | —                | Own profile      |

---

## Playwright test conventions

- **Avoid `getByLabel`** for form fields when test data might populate lists (e.g. prerequisite checkboxes with matching text). Use `getByRole("textbox", { name: "Label" })` or `getByRole("spinbutton", { name: "Label" })` instead.
- **Use `.first()`** when an element legitimately appears multiple times (e.g. status badges in a table).
- **Use `{ exact: true }`** when a substring conflict exists (e.g. `"Paid"` vs `"Paid At"`).
- **Student tests**: seed names are `Alice Johnson`, `Bob Williams`, `Carol Davis`, `David Martinez`, `Eve Wilson`.
- **Student number format**: `2025-0001` (not `STU001`).
- **Dashboard heading**: page renders `Welcome back, {firstName}` — no "Dashboard" heading.
- Each test file uses `storageState` from `tests/fixtures/{role}.json`.

---

## Seed credentials

| Role      | Email                       | Password    |
|-----------|-----------------------------|-------------|
| Admin     | admin@school.com            | admin123    |
| Professor | john.smith@school.com       | prof123     |
| Professor | maria.garcia@school.com     | prof123     |
| Student   | alice@student.com           | student123  |
| Student   | bob@student.com             | student123  |

Seed invoices: `INV-2025-0001` (Alice, PAID), `INV-2025-0002` (Bob, PENDING→OVERDUE), `INV-2025-0003` (Carol, OVERDUE), `INV-2025-0004` (David, PENDING), `INV-2025-0005` (Eve, PARTIAL).

---

## What's complete

- [x] Auth (login, JWT, role guards)
- [x] Layout shell (Sidebar, TopNav, RoleGuard)
- [x] Professors module (CRUD + Playwright tests)
- [x] Courses module (CRUD, prerequisites, enrollments + Playwright tests)
- [x] Students module (CRUD + Playwright tests)
- [x] Payments module (CRUD, OVERDUE detection + Playwright tests)
- [ ] Phase 9 Polish (dashboard role content, search/filter, loading states)
