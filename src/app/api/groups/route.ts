import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const createSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  academicYear: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const groups = await prisma.group.findMany({
    include: {
      _count: { select: { memberships: true, courses: true } },
    },
    orderBy: { name: "asc" },
  })

  return NextResponse.json(groups)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const body = await req.json()
  const parsed = createSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  const group = await prisma.group.create({ data: parsed.data })
  return NextResponse.json(group, { status: 201 })
}
