import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleGuard } from "@/components/layout/role-guard"
import { Plus } from "lucide-react"
import { cn, formatDate } from "@/lib/utils"

export default async function StudentsPage() {
  const students = await prisma.student.findMany({
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
    orderBy: { user: { name: "asc" } },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Students</h2>
          <p className="text-muted-foreground text-sm">{students.length} total</p>
        </div>
        <RoleGuard roles={["ADMIN"]}>
          <Link href="/students/new" className={cn(buttonVariants(), "gap-2")}>
            <Plus className="h-4 w-4" />
            New Student
          </Link>
        </RoleGuard>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Student No.</TableHead>
              <TableHead>Grade</TableHead>
              <TableHead>Enrolled Courses</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                  No students yet.
                </TableCell>
              </TableRow>
            )}
            {students.map((s) => (
              <TableRow key={s.id}>
                <TableCell className="font-medium">
                  <Link href={`/students/${s.id}`} className="hover:underline">{s.user.name}</Link>
                </TableCell>
                <TableCell className="text-muted-foreground">{s.user.email}</TableCell>
                <TableCell className="font-mono text-sm">{s.studentNumber}</TableCell>
                <TableCell>{s.grade ?? "—"}</TableCell>
                <TableCell>{s._count.enrollments}</TableCell>
                <TableCell className="text-muted-foreground">
                  {s.dateOfBirth ? formatDate(s.dateOfBirth) : "—"}
                </TableCell>
                <TableCell>
                  <RoleGuard roles={["ADMIN"]}>
                    <Link href={`/students/${s.id}/edit`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
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
