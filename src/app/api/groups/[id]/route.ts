import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const updateSchema = z.object({
  name: z.string().min(1, "Name is required").optional(),
  description: z.string().optional(),
  academicYear: z.string().optional(),
})

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await params
  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      memberships: {
        include: { student: { include: { user: { select: { name: true, email: true } } } } },
        orderBy: { joinedAt: "asc" },
      },
      courses: {
        include: {
          course: { select: { id: true, code: true, name: true, pricePerMonth: true } },
          professor: { include: { user: { select: { name: true } } } },
        },
        orderBy: { assignedAt: "asc" },
      },
    },
  })

  if (!group) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(group)
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  const body = await req.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const group = await prisma.group.update({ where: { id }, data: parsed.data })
  return NextResponse.json(group)
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id } = await params
  await prisma.group.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
