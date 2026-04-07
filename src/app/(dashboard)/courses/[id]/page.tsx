import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleGuard } from "@/components/layout/role-guard"
import { cn, formatDate } from "@/lib/utils"

const statusVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  PENDING: "secondary",
  DROPPED: "destructive",
  COMPLETED: "outline",
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      prerequisites: true,
      prerequisiteOf: true,
      assignments: { include: { professor: { include: { user: { select: { id: true, name: true } } } } } },
      enrollments: {
        where: { status: { not: "DROPPED" } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { enrolledAt: "desc" },
      },
      _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
    },
  })

  if (!course) notFound()

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-muted-foreground">{course.code}</span>
            <Badge variant={course.isActive ? "default" : "secondary"}>
              {course.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold mt-1">{course.name}</h2>
        </div>
        <div className="flex gap-2">
          <Link href="/courses" className={buttonVariants({ variant: "outline" })}>Back</Link>
          <RoleGuard roles={["ADMIN"]}>
            <Link href={`/courses/${id}/edit`} className={buttonVariants()}>Edit</Link>
          </RoleGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Credits</p>
            <p className="text-2xl font-bold">{course.credits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Enrolled</p>
            <p className="text-2xl font-bold">{course._count.enrollments} <span className="text-sm font-normal text-muted-foreground">/ {course.maxStudents}</span></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Professors</p>
            <p className="text-2xl font-bold">{course.assignments.length}</p>
          </CardContent>
        </Card>
      </div>

      {course.description && (
        <Card>
          <CardHeader><CardTitle className="text-base">Description</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">{course.description}</p></CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Assigned Professors</CardTitle></CardHeader>
          <CardContent>
            {course.assignments.length === 0 ? (
              <p className="text-sm text-muted-foreground">None assigned.</p>
            ) : (
              <div className="space-y-1">
                {course.assignments.map((a) => (
                  <Link key={a.id} href={`/professors/${a.professor.id}`} className="block text-sm hover:underline">
                    {a.professor.user.name}
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {course.prerequisites.length > 0 && (
          <Card>
            <CardHeader><CardTitle className="text-base">Prerequisites</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {course.prerequisites.map((p) => (
                  <Link key={p.id} href={`/courses/${p.id}`}>
                    <Badge variant="outline" className="cursor-pointer">{p.code}</Badge>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Students ({course.enrollments.length})</CardTitle>
            <RoleGuard roles={["ADMIN"]}>
              <Link href={`/courses/${id}/enroll`} className={cn(buttonVariants({ size: "sm" }), "gap-1")}>
                + Enroll Student
              </Link>
            </RoleGuard>
          </div>
        </CardHeader>
        <CardContent>
          {course.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No students enrolled.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {course.enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.student.user.name}</TableCell>
                    <TableCell>
                      <Badge variant={statusVariant[e.status] ?? "outline"}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(e.enrolledAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
