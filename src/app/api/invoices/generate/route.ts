import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const schema = z.object({
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { month, year } = parsed.data

  // Get all groups with their courses (pricePerMonth) and memberships
  const groups = await prisma.group.findMany({
    include: {
      courses: { include: { course: { select: { pricePerMonth: true } } } },
      memberships: { select: { studentId: true } },
    },
  })

  // Build a map: studentId → total monthly amount
  const studentAmounts = new Map<string, number>()
  for (const group of groups) {
    const monthlyTotal = group.courses.reduce(
      (sum, gc) => sum + (gc.course.pricePerMonth ? Number(gc.course.pricePerMonth) : 0),
      0,
    )
    if (monthlyTotal === 0) continue
    for (const { studentId } of group.memberships) {
      studentAmounts.set(studentId, (studentAmounts.get(studentId) ?? 0) + monthlyTotal)
    }
  }

  if (studentAmounts.size === 0) {
    return NextResponse.json({ created: 0, skipped: 0 })
  }

  // Find students who already have an invoice for this billing period
  const existing = await prisma.payment.findMany({
    where: {
      billingMonth: month,
      billingYear: year,
      studentId: { in: Array.from(studentAmounts.keys()) },
    },
    select: { studentId: true },
  })
  const alreadyBilled = new Set(existing.map((p) => p.studentId))

  // Count existing invoices this month to generate sequential numbers
  const prefix = `INV-${year}${String(month).padStart(2, "0")}`
  const existingCount = await prisma.payment.count({
    where: { invoiceNumber: { startsWith: prefix } },
  })

  // Last day of the billing month
  const dueDate = new Date(year, month, 0) // day 0 of next month = last day of this month

  let created = 0
  let skipped = 0
  let seq = existingCount

  for (const [studentId, amount] of studentAmounts) {
    if (alreadyBilled.has(studentId)) {
      skipped++
      continue
    }
    seq++
    const invoiceNumber = `${prefix}-${String(seq).padStart(4, "0")}`
    await prisma.payment.create({
      data: {
        studentId,
        invoiceNumber,
        type: "TUITION",
        amount,
        amountPaid: 0,
        currency: "USD",
        status: "PENDING",
        dueDate,
        billingMonth: month,
        billingYear: year,
        description: `Monthly tuition — ${new Date(year, month - 1).toLocaleString("en-US", { month: "long", year: "numeric" })}`,
      },
    })
    created++
  }

  return NextResponse.json({ created, skipped })
}
