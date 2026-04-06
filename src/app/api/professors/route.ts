import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { professorSchema } from "@/lib/validations/professor"
import bcrypt from "bcryptjs"

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const professors = await prisma.professor.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      courseAssignments: { include: { course: { select: { id: true, code: true, name: true } } } },
    },
    orderBy: { user: { name: "asc" } },
  })

  return NextResponse.json(professors)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = professorSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { name, email, phone, bio, hireDate, employmentType, department, officeRoom } = parsed.data

  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 })

  const professor = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        email,
        passwordHash: await bcrypt.hash("changeme123", 12),
        role: "PROFESSOR",
      },
    })
    return tx.professor.create({
      data: {
        userId: user.id,
        phone,
        bio,
        hireDate: new Date(hireDate),
        employmentType,
        department,
        officeRoom,
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    })
  })

  return NextResponse.json(professor, { status: 201 })
}
