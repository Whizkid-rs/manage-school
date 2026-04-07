import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleGuard } from "@/components/layout/role-guard"
import { Plus } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function CoursesPage() {
  const courses = await prisma.course.findMany({
    include: {
      assignments: { include: { professor: { include: { user: { select: { name: true } } } } } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { code: "asc" },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Courses</h2>
          <p className="text-muted-foreground text-sm">{courses.length} total</p>
        </div>
        <RoleGuard roles={["ADMIN"]}>
          <Link href="/courses/new" className={cn(buttonVariants(), "gap-2")}>
            <Plus className="h-4 w-4" />
            New Course
          </Link>
        </RoleGuard>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Professors</TableHead>
              <TableHead>Credits</TableHead>
              <TableHead>Enrolled</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {courses.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No courses yet.
                </TableCell>
              </TableRow>
            )}
            {courses.map((c) => (
              <TableRow key={c.id}>
                <TableCell className="font-mono font-medium">
                  <Link href={`/courses/${c.id}`} className="hover:underline">{c.code}</Link>
                </TableCell>
                <TableCell>
                  <Link href={`/courses/${c.id}`} className="hover:underline">{c.name}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {c.assignments.map((a) => a.professor.user.name).join(", ") || "—"}
                </TableCell>
                <TableCell>{c.credits}</TableCell>
                <TableCell>{c._count.enrollments} / {c.maxStudents}</TableCell>
                <TableCell>
                  <Badge variant={c.isActive ? "default" : "secondary"}>
                    {c.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <RoleGuard roles={["ADMIN"]}>
                    <Link href={`/courses/${c.id}/edit`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
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
