# Dashboard

Role-specific home page at `/dashboard`. Content varies by the logged-in user's role.

## Admin view

**KPI cards**
- Professors — total professor count
- Active Courses — count of courses with `isActive = true`
- Students — total student count
- Overdue Payments — count of PENDING payments past their due date (shown in red when > 0)

**Group payment status table**

Shows the current month's billing status per group:

| Column | Description |
|--------|-------------|
| Group | Link to the group detail page |
| Members | Total students in the group |
| Paid | Students who have a PAID invoice for this month |
| Outstanding | Members minus paid (shown in red when > 0) |

**Pending & overdue invoices** — latest 5 payments with status PENDING or OVERDUE, linking to payment and student detail pages.

## Professor view

**Your schedule** — table of assigned courses showing code, name, credits, enrolled/max count, and active status.

## Student view

**Summary cards**
- Active Courses — count of ACTIVE enrollments
- Overdue Invoices — count of own payments that are overdue (shown in red when > 0)
- Balance Due — sum of (amount − amount paid) across own payments (shown in red when > 0)

**Your Courses** — table of actively enrolled courses linking to course detail.

**Recent Payments** — last 5 payments with invoice number, amount, amount paid, status, and due date.
