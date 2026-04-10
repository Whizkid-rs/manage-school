# Entity Relationship Diagram

```mermaid
erDiagram

  %% ── AUTH ──────────────────────────────────────────────────────────────────

  User {
    string id PK
    string email UK
    string name
    string passwordHash
    enum   role "ADMIN | PROFESSOR | STUDENT"
  }

  Account {
    string id PK
    string userId FK
    string provider
    string providerAccountId
  }

  Session {
    string   id PK
    string   userId FK
    string   sessionToken UK
    datetime expires
  }

  User ||--o{ Account : "has"
  User ||--o{ Session : "has"

  %% ── PROFESSORS ────────────────────────────────────────────────────────────

  Professor {
    string id PK
    string userId FK "unique"
    string department
    enum   employmentType "FULL_TIME | PART_TIME | CONTRACT"
    date   hireDate
    string officeRoom
    string phone
    string bio
  }

  User ||--o| Professor : "is"

  %% ── STUDENTS ──────────────────────────────────────────────────────────────

  Student {
    string   id PK
    string   userId FK "unique"
    string   studentNumber UK
    string   grade
    datetime dateOfBirth
    string   guardianName
    string   guardianPhone
    string   address
  }

  User ||--o| Student : "is"

  %% ── COURSES ───────────────────────────────────────────────────────────────

  Course {
    string  id PK
    string  code UK
    string  name
    int     credits
    int     maxStudents
    boolean isActive
    decimal pricePerMonth
  }

  Course }o--o{ Course : "prerequisites"

  %% ── COURSE ASSIGNMENT (Professor <-> Course) ──────────────────────────────

  CourseAssignment {
    string   id PK
    string   courseId FK
    string   professorId FK
    datetime assignedAt
  }

  Professor ||--o{ CourseAssignment : "teaches"
  Course    ||--o{ CourseAssignment : "taught by"

  %% ── ENROLLMENT (Student -> Course, direct) ────────────────────────────────

  Enrollment {
    string   id PK
    string   studentId FK
    string   courseId FK
    enum     status "ACTIVE | PENDING | DROPPED | COMPLETED"
    datetime enrolledAt
    string   grade
  }

  Student ||--o{ Enrollment : "enrolled in"
  Course  ||--o{ Enrollment : "has"

  %% ── TIMETABLE ─────────────────────────────────────────────────────────────

  TimetableSlot {
    string id PK
    string courseId FK
    string professorId FK
    string room
    enum   dayOfWeek "MON..SAT"
    string startTime
    string endTime
    string academicYear
    int    semester
  }

  Course    ||--o{ TimetableSlot : "scheduled as"
  Professor ||--o{ TimetableSlot : "teaches"

  %% ── PAYMENTS ──────────────────────────────────────────────────────────────

  Payment {
    string   id PK
    string   studentId FK
    string   invoiceNumber UK
    enum     type "TUITION | REGISTRATION | EXAM_FEE | MATERIAL_FEE | OTHER"
    decimal  amount
    decimal  amountPaid
    enum     status "PENDING | PAID | PARTIAL | OVERDUE | CANCELLED"
    datetime dueDate
    datetime paidAt
    int      billingMonth
    int      billingYear
  }

  Student ||--o{ Payment : "owes"

  %% ── GROUPS ────────────────────────────────────────────────────────────────

  Group {
    string id PK
    string name
    string academicYear
    string description
  }

  GroupMembership {
    string   id PK
    string   groupId FK
    string   studentId FK
    datetime joinedAt
  }

  GroupCourse {
    string   id PK
    string   groupId FK
    string   courseId FK
    string   professorId FK
    datetime assignedAt
  }

  Group   ||--o{ GroupMembership : "has"
  Student ||--o{ GroupMembership : "belongs to"

  Group     ||--o{ GroupCourse : "attends"
  Course    ||--o{ GroupCourse : "taught to"
  Professor ||--o{ GroupCourse : "teaches"
```

## Notes

**Two paths for student–course association**

1. **Direct enrollment** (`Enrollment`) — admin enrolls a student in a specific course. Tracks individual grade and status.
2. **Group-based** (`GroupMembership` + `GroupCourse`) — students are placed in a group; courses are assigned to the group with a designated professor. This is the primary path for scheduling and billing.

**OVERDUE is computed, not stored** — `Payment.status` is always stored as `PENDING`. At read time, any `PENDING` payment past its `dueDate` is displayed as OVERDUE.

**`billingMonth` / `billingYear`** — only set on invoices created by the monthly generator. Manual payments leave these null.
