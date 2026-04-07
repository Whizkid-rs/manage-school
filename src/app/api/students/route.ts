import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"

const studentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  studentNumber: z.string().min(1),
  grade: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const students = await prisma.student.findMany({
    include: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { user: { name: "asc" } },
  })

  return NextResponse.json(students)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = studentSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const { name, email, studentNumber, grade, dateOfBirth, guardianName, guardianPhone, address } = parsed.data

  try {
    const passwordHash = await bcrypt.hash("changeme123", 10)
    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, passwordHash, role: "STUDENT" },
      })
      return tx.student.create({
        data: {
          userId: user.id,
          studentNumber,
          grade,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          guardianName,
          guardianPhone,
          address,
        },
        include: { user: { select: { id: true, name: true, email: true } } },
      })
    })
    return NextResponse.json(student, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Email or student number already exists" }, { status: 409 })
  }
}
