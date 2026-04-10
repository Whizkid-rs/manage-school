# Authentication

Login page at `/login` using email + password. JWT session stored in cookies via NextAuth.

## How it works

- Single credential provider (email + bcrypt password check via `bcryptjs`)
- JWT strategy — no database sessions
- Session carries `role`, `professorId`, `studentId` (null for non-matching roles)
- All dashboard routes protected by middleware at `src/proxy.ts`

## Role access enforcement

| Rule | Detail |
|------|--------|
| Unauthenticated | Redirected to `/login` |
| Professors | Blocked from `/payments` entirely |
| Students | Blocked from `/professors` and `/students` |
| Admin-only paths | `/professors/new`, `/students/new`, `/courses/new`, `/payments/new`, `/groups/new`, and all `edit`, `add-member`, `add-course` sub-routes |

## Roles

| Role | Description |
|------|-------------|
| `ADMIN` | Full control over all modules |
| `PROFESSOR` | Read-only access to own courses and profile |
| `STUDENT` | Read-only access to enrolled courses, own payments, own group |

## Seed credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@school.com | admin123 |
| Professor | john.smith@school.com | prof123 |
| Professor | maria.garcia@school.com | prof123 |
| Student | alice@student.com | student123 |
| Student | bob@student.com | student123 |
