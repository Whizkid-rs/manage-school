import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleGuard } from "@/components/layout/role-guard"
import { RemoveMemberButton } from "@/components/groups/remove-member-button"
import { RemoveCourseButton } from "@/components/groups/remove-course-button"
import { cn, formatCurrency } from "@/lib/utils"
import { Plus, Pencil } from "lucide-react"

export default async function GroupDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

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

  if (!group) notFound()

  const monthlyTotal = group.courses.reduce(
    (sum, gc) => sum + (gc.course.pricePerMonth ? Number(gc.course.pricePerMonth) : 0),
    0,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold">{group.name}</h2>
            {group.academicYear && <Badge variant="outline">{group.academicYear}</Badge>}
          </div>
          {group.description && (
            <p className="text-muted-foreground text-sm mt-1">{group.description}</p>
          )}
        </div>
        <RoleGuard roles={["ADMIN"]}>
          <Link href={`/groups/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
        </RoleGuard>
      </div>

      {/* Students */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Students ({group.memberships.length})</CardTitle>
          <RoleGuard roles={["ADMIN"]}>
            <Link href={`/groups/${id}/add-member`} className={cn(buttonVariants({ size: "sm" }), "gap-1")}>
              <Plus className="h-3.5 w-3.5" />
              Add Student
            </Link>
          </RoleGuard>
        </CardHeader>
        <CardContent>
          {group.memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students in this group.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.memberships.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell>
                      <Link href={`/students/${m.student.id}`} className="hover:underline font-medium">
                        {m.student.user.name}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{m.student.user.email}</TableCell>
                    <TableCell className="text-right">
                      <RoleGuard roles={["ADMIN"]}>
                        <RemoveMemberButton groupId={id} studentId={m.student.id} studentName={m.student.user.name} />
                      </RoleGuard>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Courses ({group.courses.length})</CardTitle>
          <RoleGuard roles={["ADMIN"]}>
            <Link href={`/groups/${id}/add-course`} className={cn(buttonVariants({ size: "sm" }), "gap-1")}>
              <Plus className="h-3.5 w-3.5" />
              Assign Course
            </Link>
          </RoleGuard>
        </CardHeader>
        <CardContent>
          {group.courses.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses assigned.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Professor</TableHead>
                    <TableHead>Monthly Fee</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.courses.map((gc) => (
                    <TableRow key={gc.id}>
                      <TableCell className="font-mono font-medium">
                        <Link href={`/courses/${gc.course.id}`} className="hover:underline">
                          {gc.course.code}
                        </Link>
                      </TableCell>
                      <TableCell>{gc.course.name}</TableCell>
                      <TableCell>{gc.professor.user.name}</TableCell>
                      <TableCell>
                        {gc.course.pricePerMonth
                          ? formatCurrency(Number(gc.course.pricePerMonth), "USD")
                          : <span className="text-muted-foreground">—</span>}
                      </TableCell>
                      <TableCell className="text-right">
                        <RoleGuard roles={["ADMIN"]}>
                          <RemoveCourseButton groupId={id} courseId={gc.course.id} courseName={gc.course.name} />
                        </RoleGuard>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                {monthlyTotal > 0 && (
                  <tfoot>
                    <TableRow>
                      <TableCell colSpan={3} className="text-right font-medium text-sm">Total per student / month</TableCell>
                      <TableCell className="font-bold">{formatCurrency(monthlyTotal, "USD")}</TableCell>
                      <TableCell />
                    </TableRow>
                  </tfoot>
                )}
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
