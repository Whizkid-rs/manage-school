import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const addSchema = z.object({
  courseId: z.string().min(1),
  professorId: z.string().min(1),
})

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id: groupId } = await params
  const body = await req.json()
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  try {
    const gc = await prisma.groupCourse.create({
      data: { groupId, courseId: parsed.data.courseId, professorId: parsed.data.professorId },
    })
    return NextResponse.json(gc, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Course already assigned to group" }, { status: 409 })
  }
}
