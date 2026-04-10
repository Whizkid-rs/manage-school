import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { courseSchema } from "@/lib/validations/course"

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      prerequisites: true,
      prerequisiteOf: true,
      assignments: { include: { professor: { include: { user: { select: { id: true, name: true, email: true } } } } } },
      enrollments: { include: { student: { include: { user: { select: { name: true } } } } }, orderBy: { enrolledAt: "desc" } },
      _count: { select: { enrollments: true } },
    },
  })

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(course)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = courseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { code, name, description, credits, maxStudents, pricePerMonth, isActive, prerequisiteIds, professorIds } = parsed.data

  const course = await prisma.$transaction(async (tx) => {
    const existing = await tx.course.findUnique({ where: { id } })
    if (!existing) return null

    // Replace prerequisites and professor assignments
    await tx.courseAssignment.deleteMany({ where: { courseId: id } })

    return tx.course.update({
      where: { id },
      data: {
        code,
        name,
        description,
        credits,
        maxStudents,
        pricePerMonth: pricePerMonth ?? null,
        isActive,
        prerequisites: { set: prerequisiteIds.map((pid) => ({ id: pid })) },
        assignments: { create: professorIds.map((professorId) => ({ professorId })) },
      },
      include: {
        assignments: { include: { professor: { include: { user: { select: { name: true } } } } } },
        prerequisites: true,
      },
    })
  })

  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(course)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const course = await prisma.course.findUnique({ where: { id } })
  if (!course) return NextResponse.json({ error: "Not found" }, { status: 404 })

  await prisma.course.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
