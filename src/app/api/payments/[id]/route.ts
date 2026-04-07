import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { paymentUpdateSchema } from "@/lib/validations/payment"

function computeStatus(payment: { status: string; dueDate: Date }) {
  if (payment.status === "PENDING" && new Date(payment.dueDate) < new Date()) return "OVERDUE"
  return payment.status
}

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { student: { include: { user: { select: { id: true, name: true } } } } },
  })

  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  // Students can only view their own payments
  if (session.user.role === "STUDENT" && payment.student.user.id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  return NextResponse.json({ ...payment, status: computeStatus(payment) })
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = paymentUpdateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { amountPaid, status, paidAt, notes } = parsed.data

  const payment = await prisma.payment.update({
    where: { id },
    data: {
      amountPaid,
      status,
      paidAt: paidAt ? new Date(paidAt) : status === "PAID" ? new Date() : undefined,
      notes,
    },
    include: { student: { include: { user: { select: { name: true } } } } },
  })

  return NextResponse.json({ ...payment, status: computeStatus(payment) })
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const payment = await prisma.payment.findUnique({ where: { id } })
  if (!payment) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.payment.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
