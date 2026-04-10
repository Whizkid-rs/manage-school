# Payments

Invoice management for student tuition fees.

## Access

| Action | Admin | Professor | Student |
|--------|-------|-----------|---------|
| List payments | ✓ (all) | — (blocked) | ✓ (own only) |
| View payment detail | ✓ | — | ✓ (own only) |
| Create payment manually | ✓ | — | — |
| Mark as paid / partial | ✓ | — | — |
| Generate monthly invoices | ✓ | — | — |

Professors cannot access the payments module at all — middleware redirects them to `/dashboard`.

## Key fields

| Field | Notes |
|-------|-------|
| Invoice number | Auto-generated. See numbering below |
| Amount | Total owed |
| Amount paid | Partial payments tracked separately |
| Status | See statuses below |
| Due date | When payment is expected |
| Billing month / year | Set on generated invoices; null on manual ones |
| Description | Free text |
| Notes | Internal notes |

## Statuses

| Status | Meaning |
|--------|---------|
| `PENDING` | Awaiting payment |
| `PAID` | Fully paid |
| `PARTIAL` | Part of the amount has been paid |
| `OVERDUE` | Computed on-read — `PENDING` payments past their due date display as OVERDUE. The DB always stores `PENDING` |
| `CANCELLED` | Voided invoice |

## Invoice numbering

| Type | Format | Example |
|------|--------|---------|
| Manual | `INV-YYYYMMDD-XXXX` | `INV-20260410-0001` |
| Monthly generated | `INV-YYYYMM-XXXX` | `INV-202604-0001` |

`XXXX` is a zero-padded sequential counter scoped to the prefix.

## Monthly invoice generation

Admin opens the "Generate Monthly Invoices" dialog on the payments list page, selects a month and year, and clicks Generate.

The system:
1. Fetches all groups with their assigned courses and `pricePerMonth`
2. For each group member (student), sums the monthly fees across the group's courses
3. Skips any student who already has a payment for that `billingMonth` + `billingYear`
4. Creates one `Payment` per student with:
   - `amount` = sum of course prices
   - `dueDate` = last day of the billing month
   - `status` = `PENDING`
   - `billingMonth` / `billingYear` set for deduplication

Returns `{ created, skipped }` counts.
