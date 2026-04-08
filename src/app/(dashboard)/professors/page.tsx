import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { RoleGuard } from "@/components/layout/role-guard"
import { SearchInput } from "@/components/ui/search-input"
import { Plus, Mail, Phone, Building2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Suspense } from "react"

async function ProfessorList({ q }: { q: string }) {
  const professors = await prisma.professor.findMany({
    where: q
      ? {
          OR: [
            { user: { name: { contains: q, mode: "insensitive" } } },
            { user: { email: { contains: q, mode: "insensitive" } } },
            { department: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { courseAssignments: true } },
    },
    orderBy: { user: { name: "asc" } },
  })

  if (professors.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-12">
        {q ? `No professors match "${q}".` : "No professors yet."}
      </p>
    )
  }

  const TYPE_LABEL: Record<string, string> = {
    FULL_TIME: "Full-time",
    PART_TIME: "Part-time",
    CONTRACT: "Contract",
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {professors.map((p) => (
        <Card key={p.id} className="hover:shadow-md transition-shadow">
          <CardContent className="pt-5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <Link href={`/professors/${p.id}`} className="font-semibold hover:underline truncate block">
                  {p.user.name}
                </Link>
                <Badge variant="secondary" className="mt-1 text-xs">
                  {TYPE_LABEL[p.employmentType] ?? p.employmentType}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground shrink-0">{p._count.courseAssignments} course{p._count.courseAssignments !== 1 ? "s" : ""}</span>
            </div>
            <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
              <p className="flex items-center gap-1.5 truncate"><Mail className="h-3.5 w-3.5 shrink-0" />{p.user.email}</p>
              {p.phone && <p className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 shrink-0" />{p.phone}</p>}
              {p.department && <p className="flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5 shrink-0" />{p.department}</p>}
            </div>
            <div className="mt-4 flex gap-2">
              <Link href={`/professors/${p.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "flex-1 justify-center")}>
                View
              </Link>
              <RoleGuard roles={["ADMIN"]}>
                <Link href={`/professors/${p.id}/edit`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "flex-1 justify-center")}>
                  Edit
                </Link>
              </RoleGuard>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function ProfessorsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  const { q = "" } = await searchParams

  const total = await prisma.professor.count()

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Professors</h2>
          <p className="text-muted-foreground text-sm">{total} total</p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <SearchInput placeholder="Search professors..." />
          </Suspense>
          <RoleGuard roles={["ADMIN"]}>
            <Link href="/professors/new" className={cn(buttonVariants(), "gap-2 shrink-0")}>
              <Plus className="h-4 w-4" />
              New Professor
            </Link>
          </RoleGuard>
        </div>
      </div>

      <ProfessorList q={q} />
    </div>
  )
}
