import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { professorSchema } from "@/lib/validations/professor"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const professor = await prisma.professor.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      courseAssignments: { include: { course: true } },
      timetableSlots: { include: { course: true }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
    },
  })

  if (!professor) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(professor)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = professorSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, phone, bio, hireDate, employmentType, department, officeRoom } = parsed.data

  const professor = await prisma.$transaction(async (tx) => {
    const existing = await tx.professor.findUnique({ where: { id }, include: { user: true } })
    if (!existing) return null
    await tx.user.update({ where: { id: existing.userId }, data: { name } })
    return tx.professor.update({
      where: { id },
      data: { phone, bio, hireDate: new Date(hireDate), employmentType, department, officeRoom },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  })

  if (!professor) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(professor)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const professor = await prisma.professor.findUnique({ where: { id } })
  if (!professor) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.user.delete({ where: { id: professor.userId } })
  return new NextResponse(null, { status: 204 })
}
