import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { paymentSchema } from "@/lib/validations/payment"

function computeStatus(payment: { status: string; dueDate: Date; amountPaid: any; amount: any }) {
  if (payment.status === "PENDING" && new Date(payment.dueDate) < new Date()) return "OVERDUE"
  return payment.status
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const where = session.user.role === "STUDENT" && session.user.studentId
    ? { student: { id: session.user.studentId } }
    : {}

  const payments = await prisma.payment.findMany({
    where,
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: { dueDate: "desc" },
  })

  return NextResponse.json(payments.map((p) => ({ ...p, status: computeStatus(p) })))
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = paymentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { studentId, type, amount, currency, dueDate, description, notes } = parsed.data

  const student = await prisma.student.findUnique({ where: { id: studentId } })
  if (!student) return NextResponse.json({ error: "Student not found" }, { status: 404 })

  // Generate invoice number: INV-YYYYMMDD-<random 4 digits>
  const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.floor(1000 + Math.random() * 9000)}`

  const payment = await prisma.payment.create({
    data: {
      studentId,
      type,
      amount,
      currency,
      dueDate: new Date(dueDate),
      description,
      notes,
      invoiceNumber,
    },
    include: { student: { include: { user: { select: { name: true } } } } },
  })

  return NextResponse.json({ ...payment, status: computeStatus(payment) }, { status: 201 })
}
