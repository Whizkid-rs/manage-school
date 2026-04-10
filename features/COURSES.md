# Courses

Course catalog with enrollment and pricing management.

## Access

| Action | Admin | Professor | Student |
|--------|-------|-----------|---------|
| List courses | ✓ | ✓ | ✓ |
| View course detail | ✓ | ✓ (assigned only) | ✓ (enrolled only) |
| Create / edit / delete | ✓ | — | — |
| Enroll student | ✓ | — | — |
| Drop student | ✓ | — | — |

## Key fields

| Field | Notes |
|-------|-------|
| Code | Unique identifier, e.g. `MATH101`. Immutable after creation |
| Name | Display name |
| Credits | Integer, 1–10 |
| Max students | Enrollment cap |
| Monthly price | Optional decimal — used for invoice generation |
| Active flag | Inactive courses are hidden from enrollment |
| Prerequisites | Self-referential many-to-many (other courses) |
| Assigned professors | Many-to-many via `CourseAssignment` |

## Detail page

- Stat cards: credits, enrolled count, professor count
- Assigned professors list
- Enrolled students table with enrollment status and grade
- "Enroll Student" button (admin only)

## Monthly price

`pricePerMonth` is used by the invoice generator. When a course is assigned to a group, its monthly price contributes to each group member's monthly invoice total.
