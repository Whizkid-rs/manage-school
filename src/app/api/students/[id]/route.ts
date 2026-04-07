import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  grade: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      enrollments: {
        include: { course: { select: { id: true, code: true, name: true } } },
        orderBy: { enrolledAt: "desc" },
      },
      payments: { orderBy: { dueDate: "desc" } },
    },
  })

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(student)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { name, ...studentFields } = parsed.data

  const student = await prisma.$transaction(async (tx) => {
    const existing = await tx.student.findUnique({ where: { id } })
    if (!existing) return null
    if (name) await tx.user.update({ where: { id: existing.userId }, data: { name } })
    return tx.student.update({
      where: { id },
      data: {
        grade: studentFields.grade,
        dateOfBirth: studentFields.dateOfBirth ? new Date(studentFields.dateOfBirth) : undefined,
        guardianName: studentFields.guardianName,
        guardianPhone: studentFields.guardianPhone,
        address: studentFields.address,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  })

  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(student)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const student = await prisma.student.findUnique({ where: { id } })
  if (!student) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.user.delete({ where: { id: student.userId } })
  return new NextResponse(null, { status: 204 })
}
