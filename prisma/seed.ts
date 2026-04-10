import { config } from "dotenv"
config()
import { Pool } from "pg"
import { PrismaPg } from "@prisma/adapter-pg"
import { PrismaClient, Role, EmploymentType, EnrollmentStatus, DayOfWeek, PaymentType, PaymentStatus } from "@prisma/client"
import bcrypt from "bcryptjs"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter } as any)

async function main() {
  console.log("Seeding database...")

  const hash = (pw: string) => bcrypt.hash(pw, 12)

  // ─── ADMIN ───────────────────────────────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@school.com" },
    update: {},
    create: {
      email: "admin@school.com",
      name: "School Admin",
      passwordHash: await hash("admin123"),
      role: Role.ADMIN,
    },
  })

  // ─── PROFESSORS ──────────────────────────────────────────────────────────
  const prof1User = await prisma.user.upsert({
    where: { email: "john.smith@school.com" },
    update: {},
    create: {
      email: "john.smith@school.com",
      name: "John Smith",
      passwordHash: await hash("prof123"),
      role: Role.PROFESSOR,
    },
  })

  const prof2User = await prisma.user.upsert({
    where: { email: "maria.garcia@school.com" },
    update: {},
    create: {
      email: "maria.garcia@school.com",
      name: "Maria Garcia",
      passwordHash: await hash("prof123"),
      role: Role.PROFESSOR,
    },
  })

  const prof1 = await prisma.professor.upsert({
    where: { userId: prof1User.id },
    update: {},
    create: {
      userId: prof1User.id,
      phone: "+1 555-0101",
      bio: "PhD in Mathematics, 10 years of teaching experience.",
      hireDate: new Date("2015-09-01"),
      employmentType: EmploymentType.FULL_TIME,
      department: "Mathematics",
      officeRoom: "B-201",
    },
  })

  const prof2 = await prisma.professor.upsert({
    where: { userId: prof2User.id },
    update: {},
    create: {
      userId: prof2User.id,
      phone: "+1 555-0102",
      bio: "MSc in Physics, specialist in quantum mechanics.",
      hireDate: new Date("2018-02-01"),
      employmentType: EmploymentType.FULL_TIME,
      department: "Sciences",
      officeRoom: "C-105",
    },
  })

  // ─── COURSES ─────────────────────────────────────────────────────────────
  const mathCourse = await prisma.course.upsert({
    where: { code: "MATH101" },
    update: { pricePerMonth: 500 },
    create: {
      code: "MATH101",
      name: "Introduction to Calculus",
      description: "Fundamentals of differential and integral calculus.",
      credits: 4,
      maxStudents: 30,
      isActive: true,
      pricePerMonth: 500,
    },
  })

  const physicsCourse = await prisma.course.upsert({
    where: { code: "PHYS101" },
    update: { pricePerMonth: 450 },
    create: {
      code: "PHYS101",
      name: "General Physics I",
      description: "Mechanics, thermodynamics, and waves.",
      credits: 4,
      maxStudents: 25,
      isActive: true,
      pricePerMonth: 450,
    },
  })

  const algCourse = await prisma.course.upsert({
    where: { code: "MATH201" },
    update: { pricePerMonth: 550 },
    create: {
      code: "MATH201",
      name: "Linear Algebra",
      description: "Vectors, matrices, and linear transformations.",
      credits: 3,
      maxStudents: 30,
      isActive: true,
      pricePerMonth: 550,
      prerequisites: { connect: [{ id: mathCourse.id }] },
    },
  })

  // Assign professors to courses
  await prisma.courseAssignment.upsert({
    where: { courseId_professorId: { courseId: mathCourse.id, professorId: prof1.id } },
    update: {},
    create: { courseId: mathCourse.id, professorId: prof1.id },
  })

  await prisma.courseAssignment.upsert({
    where: { courseId_professorId: { courseId: algCourse.id, professorId: prof1.id } },
    update: {},
    create: { courseId: algCourse.id, professorId: prof1.id },
  })

  await prisma.courseAssignment.upsert({
    where: { courseId_professorId: { courseId: physicsCourse.id, professorId: prof2.id } },
    update: {},
    create: { courseId: physicsCourse.id, professorId: prof2.id },
  })

  // ─── TIMETABLE ───────────────────────────────────────────────────────────
  const slotData = [
    { courseId: mathCourse.id, professorId: prof1.id, room: "A-101", dayOfWeek: DayOfWeek.MONDAY, startTime: "08:00", endTime: "09:30" },
    { courseId: mathCourse.id, professorId: prof1.id, room: "A-101", dayOfWeek: DayOfWeek.WEDNESDAY, startTime: "08:00", endTime: "09:30" },
    { courseId: physicsCourse.id, professorId: prof2.id, room: "B-301", dayOfWeek: DayOfWeek.TUESDAY, startTime: "10:00", endTime: "11:30" },
    { courseId: physicsCourse.id, professorId: prof2.id, room: "B-301", dayOfWeek: DayOfWeek.THURSDAY, startTime: "10:00", endTime: "11:30" },
    { courseId: algCourse.id, professorId: prof1.id, room: "A-102", dayOfWeek: DayOfWeek.FRIDAY, startTime: "13:00", endTime: "14:30" },
  ]

  for (const slot of slotData) {
    await prisma.timetableSlot.upsert({
      where: {
        room_dayOfWeek_startTime_academicYear_semester: {
          room: slot.room, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime,
          academicYear: "2025-2026", semester: 1,
        },
      },
      update: {},
      create: { ...slot, academicYear: "2025-2026", semester: 1 },
    })
  }

  // ─── STUDENTS ────────────────────────────────────────────────────────────
  const studentData = [
    { email: "alice@student.com", name: "Alice Johnson", studentNumber: "2025-0001", grade: "10A" },
    { email: "bob@student.com", name: "Bob Williams", studentNumber: "2025-0002", grade: "10A" },
    { email: "carol@student.com", name: "Carol Davis", studentNumber: "2025-0003", grade: "11B" },
    { email: "david@student.com", name: "David Martinez", studentNumber: "2025-0004", grade: "11B" },
    { email: "eve@student.com", name: "Eve Wilson", studentNumber: "2025-0005", grade: "10A" },
  ]

  const students = []
  for (const s of studentData) {
    const user = await prisma.user.upsert({
      where: { email: s.email },
      update: {},
      create: { email: s.email, name: s.name, passwordHash: await hash("student123"), role: Role.STUDENT },
    })
    const student = await prisma.student.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id, studentNumber: s.studentNumber, grade: s.grade },
    })
    students.push(student)
  }

  // Enroll students
  const enrollments = [
    { studentId: students[0].id, courseId: mathCourse.id },
    { studentId: students[0].id, courseId: physicsCourse.id },
    { studentId: students[1].id, courseId: mathCourse.id },
    { studentId: students[2].id, courseId: physicsCourse.id },
    { studentId: students[2].id, courseId: algCourse.id },
    { studentId: students[3].id, courseId: mathCourse.id },
    { studentId: students[4].id, courseId: physicsCourse.id },
  ]

  for (const e of enrollments) {
    await prisma.enrollment.upsert({
      where: { studentId_courseId: { studentId: e.studentId, courseId: e.courseId } },
      update: {},
      create: { ...e, status: EnrollmentStatus.ACTIVE },
    })
  }

  // ─── PAYMENTS ────────────────────────────────────────────────────────────
  const paymentData = [
    { studentId: students[0].id, invoiceNumber: "INV-2025-0001", amount: 1500, dueDate: new Date("2026-02-01"), status: PaymentStatus.PAID, paidAt: new Date("2026-01-28") },
    { studentId: students[1].id, invoiceNumber: "INV-2025-0002", amount: 1500, dueDate: new Date("2026-02-01"), status: PaymentStatus.PENDING },
    { studentId: students[2].id, invoiceNumber: "INV-2025-0003", amount: 1500, dueDate: new Date("2026-01-01"), status: PaymentStatus.OVERDUE },
    { studentId: students[3].id, invoiceNumber: "INV-2025-0004", amount: 1500, dueDate: new Date("2026-03-01"), status: PaymentStatus.PENDING },
    { studentId: students[4].id, invoiceNumber: "INV-2025-0005", amount: 1500, dueDate: new Date("2026-02-15"), status: PaymentStatus.PARTIAL, amountPaid: 750 },
  ]

  for (const p of paymentData) {
    await prisma.payment.upsert({
      where: { invoiceNumber: p.invoiceNumber },
      update: {},
      create: {
        studentId: p.studentId,
        invoiceNumber: p.invoiceNumber,
        type: PaymentType.TUITION,
        amount: p.amount,
        amountPaid: p.amountPaid ?? 0,
        currency: "USD",
        status: p.status,
        dueDate: p.dueDate,
        paidAt: p.paidAt ?? null,
        description: "Semester 1 Tuition Fee",
      },
    })
  }

  // ─── GROUPS ──────────────────────────────────────────────────────────────
  const group10A = await prisma.group.upsert({
    where: { id: "seed-group-10a" },
    update: {},
    create: {
      id: "seed-group-10a",
      name: "Class 10A",
      description: "First year class A",
      academicYear: "2025-2026",
    },
  })

  const group11B = await prisma.group.upsert({
    where: { id: "seed-group-11b" },
    update: {},
    create: {
      id: "seed-group-11b",
      name: "Class 11B",
      description: "Second year class B",
      academicYear: "2025-2026",
    },
  })

  // Group memberships: Alice (0), Bob (1), Eve (4) → 10A; Carol (2), David (3) → 11B
  const memberships = [
    { groupId: group10A.id, studentId: students[0].id },
    { groupId: group10A.id, studentId: students[1].id },
    { groupId: group10A.id, studentId: students[4].id },
    { groupId: group11B.id, studentId: students[2].id },
    { groupId: group11B.id, studentId: students[3].id },
  ]
  for (const m of memberships) {
    await prisma.groupMembership.upsert({
      where: { groupId_studentId: { groupId: m.groupId, studentId: m.studentId } },
      update: {},
      create: m,
    })
  }

  // Group courses: 10A → MATH101 (Smith), PHYS101 (Garcia); 11B → PHYS101 (Garcia), MATH201 (Smith)
  const groupCourses = [
    { groupId: group10A.id, courseId: mathCourse.id, professorId: prof1.id },
    { groupId: group10A.id, courseId: physicsCourse.id, professorId: prof2.id },
    { groupId: group11B.id, courseId: physicsCourse.id, professorId: prof2.id },
    { groupId: group11B.id, courseId: algCourse.id, professorId: prof1.id },
  ]
  for (const gc of groupCourses) {
    await prisma.groupCourse.upsert({
      where: { groupId_courseId: { groupId: gc.groupId, courseId: gc.courseId } },
      update: {},
      create: gc,
    })
  }

  console.log("✅ Seed complete!")
  console.log("  Admin:      admin@school.com / admin123")
  console.log("  Professor:  john.smith@school.com / prof123")
  console.log("  Student:    alice@student.com / student123")
}

main()
  .catch((e) => { console.error(e); process.exit(1) })
  .finally(() => prisma.$disconnect())
