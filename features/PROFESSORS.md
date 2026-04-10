# Professors

Manage teaching staff profiles.

## Access

| Action | Admin | Professor | Student |
|--------|-------|-----------|---------|
| List professors | ✓ | ✓ (own profile only) | — |
| View professor detail | ✓ | ✓ | — |
| Create | ✓ | — | — |
| Edit | ✓ | — | — |
| Delete | ✓ | — | — |

## Key fields

| Field | Notes |
|-------|-------|
| Name, email | Login credentials created alongside |
| Department | Optional grouping (e.g. "Mathematics") |
| Employment type | `FULL_TIME`, `PART_TIME`, or `CONTRACT` |
| Hire date | Required |
| Office room | Optional |
| Bio | Free text, optional |

## Detail page

Shows the professor's assigned courses. Professors can view their own profile page.

## Creation

Creating a professor also creates a linked `User` record (role `PROFESSOR`) with a temporary password set to `changeme123`.
