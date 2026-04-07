import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { courseSchema } from "@/lib/validations/course"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const courses = await prisma.course.findMany({
    include: {
      assignments: { include: { professor: { include: { user: { select: { name: true } } } } } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { code: "asc" },
  })

  return NextResponse.json(courses)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = courseSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { code, name, description, credits, maxStudents, isActive, prerequisiteIds, professorIds } = parsed.data

  const existing = await prisma.course.findUnique({ where: { code } })
  if (existing) return NextResponse.json({ error: "Course code already in use" }, { status: 409 })

  const course = await prisma.course.create({
    data: {
      code,
      name,
      description,
      credits,
      maxStudents,
      isActive,
      prerequisites: { connect: prerequisiteIds.map((id) => ({ id })) },
      assignments: {
        create: professorIds.map((professorId) => ({ professorId })),
      },
    },
    include: {
      assignments: { include: { professor: { include: { user: { select: { name: true } } } } } },
      prerequisites: true,
    },
  })

  return NextResponse.json(course, { status: 201 })
}
