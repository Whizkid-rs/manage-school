# Students

Student registry and profile management.

## Access

| Action | Admin | Professor | Student |
|--------|-------|-----------|---------|
| List students | ✓ | — | — |
| View student detail | ✓ | — | — |
| Create / edit / delete | ✓ | — | — |

## Key fields

| Field | Notes |
|-------|-------|
| Name, email | Login credentials created alongside |
| Student number | Unique, e.g. `2025-0001` |
| Grade | Free text, e.g. `10A` |
| Date of birth | Optional |
| Guardian name / phone | Optional |
| Address | Optional |

## Detail page

Shows the student's active course enrollments and recent payment history.

## Creation

Creating a student also creates a linked `User` record (role `STUDENT`) with a temporary password set to `changeme123`.

## Enrollment

Students are enrolled in courses either:
- Directly via the course detail page → "Enroll Student" (admin action)
- Implicitly through group membership — groups have courses assigned to them, so all group members attend those courses

Enrollment statuses: `ACTIVE`, `PENDING`, `DROPPED`, `COMPLETED`
