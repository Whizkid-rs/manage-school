import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleGuard } from "@/components/layout/role-guard"
import { Plus } from "lucide-react"
import { formatDate, cn } from "@/lib/utils"

const employmentLabels = { FULL_TIME: "Full Time", PART_TIME: "Part Time", CONTRACT: "Contract" }

export default async function ProfessorsPage() {
  await getServerSession(authOptions)

  const professors = await prisma.professor.findMany({
    include: {
      user: { select: { name: true, email: true } },
      courseAssignments: true,
    },
    orderBy: { user: { name: "asc" } },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Professors</h2>
          <p className="text-muted-foreground text-sm">{professors.length} total</p>
        </div>
        <RoleGuard roles={["ADMIN"]}>
          <Link href="/professors/new" className={cn(buttonVariants(), "gap-2")}>
            <Plus className="h-4 w-4" />
            New Professor
          </Link>
        </RoleGuard>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Department</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Courses</TableHead>
              <TableHead>Hired</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {professors.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No professors yet.
                </TableCell>
              </TableRow>
            )}
            {professors.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">
                  <Link href={`/professors/${p.id}`} className="hover:underline">
                    {p.user.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{p.user.email}</TableCell>
                <TableCell>{p.department ?? "—"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{employmentLabels[p.employmentType]}</Badge>
                </TableCell>
                <TableCell>{p.courseAssignments.length}</TableCell>
                <TableCell className="text-muted-foreground">{formatDate(p.hireDate)}</TableCell>
                <TableCell>
                  <RoleGuard roles={["ADMIN"]}>
                    <Link href={`/professors/${p.id}/edit`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                      Edit
                    </Link>
                  </RoleGuard>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
