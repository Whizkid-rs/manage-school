# Groups

Class cohorts that link students to courses with a specific professor. Groups are the primary unit for scheduling and billing.

## Access

| Action | Admin | Professor | Student |
|--------|-------|-----------|---------|
| List groups | ✓ (all) | — | ✓ (own group only) |
| View group detail | ✓ | — | ✓ |
| Create / edit / delete | ✓ | — | — |
| Add / remove members | ✓ | — | — |
| Assign / remove courses | ✓ | — | — |

## Key fields

| Field | Notes |
|-------|-------|
| Name | e.g. "Class 10A" |
| Academic year | e.g. "2025-2026" |
| Description | Optional free text |

## How groups work

A group connects two things:

**Members** — students who belong to the group via `GroupMembership`. A student can be in at most one group per unique group (uniqueness enforced at DB level).

**Courses** — courses assigned to the group via `GroupCourse`, each with a designated professor. A course can only be assigned once per group.

## Detail page

- Members table with name, email, and remove action (admin only)
- Courses table with course code, name, assigned professor, and monthly fee
- Total monthly fee per student (sum of all assigned course prices)

## Relationship to billing

When monthly invoices are generated, the system iterates over all groups:
1. Sums `pricePerMonth` across the group's assigned courses
2. Creates one invoice per group member for that total

See [PAYMENTS.md](PAYMENTS.md) for invoice generation details.

## Seed data

| Group | Members | Courses |
|-------|---------|---------|
| Class 10A | Alice, Bob, Eve | MATH101 (Smith), PHYS101 (Garcia) |
| Class 11B | Carol, David | PHYS101 (Garcia), MATH201 (Smith) |
