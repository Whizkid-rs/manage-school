# Groups, Pricing & Monthly Invoicing

## Summary

Three new core features added on top of the existing school management app:
1. **Groups** — class cohorts (e.g. "Class 10A") that students belong to; courses are assigned to groups with a specific professor
2. **Course pricing** — each course has a fixed monthly fee (`pricePerMonth`)
3. **Monthly invoicing** — admin triggers consolidated invoice generation per student per month (one invoice summing all course fees from their group)

---

## Schema Changes

### New models

```prisma
model Group {
  id           String   @id @default(cuid())
  name         String
  description  String?
  academicYear String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  memberships GroupMembership[]
  courses     GroupCourse[]
}

model GroupMembership {
  id        String   @id @default(cuid())
  groupId   String
  studentId String
  group     Group    @relation(fields: [groupId], references: [id], onDelete: Cascade)
  student   Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  joinedAt  DateTime @default(now())

  @@unique([groupId, studentId])
}

model GroupCourse {
  id          String    @id @default(cuid())
  groupId     String
  courseId    String
  professorId String
  group       Group     @relation(fields: [groupId], references: [id], onDelete: Cascade)
  course      Course    @relation(fields: [courseId], references: [id], onDelete: Cascade)
  professor   Professor @relation(fields: [professorId], references: [id], onDelete: Cascade)
  assignedAt  DateTime  @default(now())

  @@unique([groupId, courseId])
}
```

### Additions to existing models

- **Course**: `pricePerMonth Decimal? @db.Decimal(10, 2)`
- **Payment**: `billingMonth Int?`, `billingYear Int?`
- **Student**: `groupMemberships GroupMembership[]`
- **Professor**: `groupCourses GroupCourse[]`
- **Course**: `groupCourses GroupCourse[]`

---

## API Routes

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| GET | `/api/groups` | All | List all groups |
| POST | `/api/groups` | Admin | Create group |
| GET | `/api/groups/[id]` | All | Group detail |
| PUT | `/api/groups/[id]` | Admin | Update group |
| DELETE | `/api/groups/[id]` | Admin | Delete group |
| POST | `/api/groups/[id]/members` | Admin | Add student to group |
| DELETE | `/api/groups/[id]/members/[studentId]` | Admin | Remove student |
| POST | `/api/groups/[id]/courses` | Admin | Assign course + professor |
| DELETE | `/api/groups/[id]/courses/[courseId]` | Admin | Remove course |
| POST | `/api/invoices/generate` | Admin | Generate monthly invoices |

### Invoice generation logic

Body: `{ month: 1–12, year: YYYY }`

1. For each Group → get all GroupCourse entries with `course.pricePerMonth`
2. For each GroupMembership (student) → sum pricePerMonth across the group's courses
3. Skip students who already have a Payment for that `billingMonth` + `billingYear`
4. Create one Payment per student: amount = sum, dueDate = last day of the month, invoiceNumber = `INV-YYYYMM-XXXX`
5. Return `{ created: number, skipped: number }`

---

## Pages

### New: Groups module

| Path | Access | Description |
|------|--------|-------------|
| `/groups` | Admin + Student | List groups (students see only their own) |
| `/groups/new` | Admin | Create group form |
| `/groups/[id]` | Admin + Student | Detail: members + courses tables |
| `/groups/[id]/edit` | Admin | Edit name/description |
| `/groups/[id]/add-member` | Admin | Add student dropdown |
| `/groups/[id]/add-course` | Admin | Assign course + professor |

### Modified pages

- **Course new/edit**: add `pricePerMonth` input
- **Course detail**: display price
- **Dashboard (Admin)**: add group payment status widget (group × % paid for current month)
- **Payments list**: add "Generate Monthly Invoices" button (Admin only)
- **Sidebar**: add "Groups" nav item (Admin + Student)

---

## Seed Data

Courses get `pricePerMonth`: MATH101 → $500, PHYS101 → $450, MATH201 → $550

Groups:
- **Class 10A** (2025-2026): Alice, Bob, Eve → MATH101 (Smith), PHYS101 (Garcia)
- **Class 11B** (2025-2026): Carol, David → PHYS101 (Garcia), MATH201 (Smith)

---

## Access Control (proxy.ts)

- `/groups/new`, `/groups/*/edit`, `/groups/*/add-member`, `/groups/*/add-course` → Admin only
- `/groups`, `/groups/[id]` → All authenticated roles

---

## Verification

1. Create group via UI → add students → assign courses (with prices)
2. Generate monthly invoices → one Payment per student, amount = sum of course prices
3. Re-generate same month → no duplicates (`skipped` count increases)
4. Dashboard admin shows group payment status table
5. Student sees their group read-only; cannot access edit/add pages
6. All 122 existing tests still pass
