import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { enrollmentSchema } from "@/lib/validations/course"

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id: courseId } = await params
  const body = await req.json()
  const parsed = enrollmentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { _count: { select: { enrollments: { where: { status: "ACTIVE" } } } } },
  })
  if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })
  if (course._count.enrollments >= course.maxStudents) {
    return NextResponse.json({ error: "Course is full" }, { status: 409 })
  }

  try {
    const enrollment = await prisma.enrollment.create({
      data: { studentId: parsed.data.studentId, courseId, status: "ACTIVE" },
      include: { student: { include: { user: { select: { name: true } } } } },
    })
    return NextResponse.json(enrollment, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Student already enrolled in this course" }, { status: 409 })
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id: courseId } = await params
  const { studentId } = await req.json()

  await prisma.enrollment.updateMany({
    where: { courseId, studentId },
    data: { status: "DROPPED" },
  })

  return new NextResponse(null, { status: 204 })
}
