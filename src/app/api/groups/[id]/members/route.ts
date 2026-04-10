import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"
import { z } from "zod"

const addSchema = z.object({ studentId: z.string().min(1) })

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  if (session.user.role !== "ADMIN") return NextResponse.json({ error: "Forbidden" }, { status: 403 })

  const { id: groupId } = await params
  const body = await req.json()
  const parsed = addSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues }, { status: 400 })

  try {
    const membership = await prisma.groupMembership.create({
      data: { groupId, studentId: parsed.data.studentId },
    })
    return NextResponse.json(membership, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Student already in group" }, { status: 409 })
  }
}
