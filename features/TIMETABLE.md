# Timetable

Weekly schedule grid showing course time slots by day and room.

## Access

| Action | Admin | Professor | Student |
|--------|-------|-----------|---------|
| View weekly grid | ✓ (all slots) | ✓ (own slots only) | ✓ (enrolled courses only) |
| Add slot | ✓ | — | — |
| Edit / delete slot | ✓ | — | — |

## Key fields

| Field | Notes |
|-------|-------|
| Course | Which course the slot belongs to |
| Professor | Who teaches this slot |
| Room | Physical room identifier |
| Day of week | Monday – Saturday |
| Start / end time | `HH:mm` format |
| Academic year | e.g. `2025-2026` |
| Semester | `1` or `2` |

## Conflict prevention

Two uniqueness constraints enforced at the database level:

1. **Room conflict** — same room, day, start time, academic year, semester cannot be booked twice
2. **Professor conflict** — same professor, day, start time, academic year, semester cannot appear twice

Attempting to create a conflicting slot returns a `409 Conflict` response with details about which constraint was violated.

## Weekly grid view

Displayed as a CSS grid with days as columns (Mon–Sat) and time bands (07:00–19:00, 30-minute rows) as rows. Slots span multiple rows based on their duration.
