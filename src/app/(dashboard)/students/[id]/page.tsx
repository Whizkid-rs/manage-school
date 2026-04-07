import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleGuard } from "@/components/layout/role-guard"
import { cn, formatDate, formatCurrency } from "@/lib/utils"
import { Mail, Phone, MapPin, User } from "lucide-react"

const enrollmentVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  ACTIVE: "default",
  PENDING: "secondary",
  DROPPED: "destructive",
  COMPLETED: "outline",
}

const paymentVariant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PAID: "default",
  PENDING: "secondary",
  PARTIAL: "secondary",
  OVERDUE: "destructive",
  CANCELLED: "outline",
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      enrollments: {
        include: { course: { select: { id: true, code: true, name: true, credits: true } } },
        orderBy: { enrolledAt: "desc" },
      },
      payments: { orderBy: { dueDate: "desc" } },
    },
  })

  if (!student) notFound()

  const activeEnrollments = student.enrollments.filter((e) => e.status === "ACTIVE").length
  const totalOwed = student.payments.reduce((sum, p) => sum + Number(p.amount) - Number(p.amountPaid), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{student.user.name}</h2>
          <p className="text-muted-foreground text-sm font-mono mt-1">{student.studentNumber}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/students" className={buttonVariants({ variant: "outline" })}>Back</Link>
          <RoleGuard roles={["ADMIN"]}>
            <Link href={`/students/${id}/edit`} className={buttonVariants()}>Edit</Link>
          </RoleGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Active Courses</p>
            <p className="text-2xl font-bold">{activeEnrollments}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Total Payments</p>
            <p className="text-2xl font-bold">{student.payments.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-sm text-muted-foreground">Balance Due</p>
            <p className={cn("text-2xl font-bold", totalOwed > 0 && "text-destructive")}>
              {formatCurrency(totalOwed)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Contact & Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />{student.user.email}
            </div>
            {student.grade && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />Grade: {student.grade}
              </div>
            )}
            {student.dateOfBirth && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />Born: {formatDate(student.dateOfBirth)}
              </div>
            )}
            {student.guardianName && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />Guardian: {student.guardianName}
                {student.guardianPhone && (
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{student.guardianPhone}</span>
                )}
              </div>
            )}
            {student.address && (
              <div className="flex items-start gap-2 text-muted-foreground">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />{student.address}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrollments ({student.enrollments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {student.enrollments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No enrollments.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Course</TableHead>
                  <TableHead>Credits</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrolled</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.enrollments.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell>
                      <Link href={`/courses/${e.course.id}`} className="hover:underline font-medium">
                        {e.course.code} — {e.course.name}
                      </Link>
                    </TableCell>
                    <TableCell>{e.course.credits}</TableCell>
                    <TableCell>
                      <Badge variant={enrollmentVariant[e.status] ?? "outline"}>{e.status}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{formatDate(e.enrolledAt)}</TableCell>
                    <TableCell className="text-muted-foreground">{e.grade ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {student.payments.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Payments ({student.payments.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {student.payments.map((p) => {
                  const isOverdue = p.status === "PENDING" && new Date(p.dueDate) < new Date()
                  const displayStatus = isOverdue ? "OVERDUE" : p.status
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">{p.invoiceNumber}</TableCell>
                      <TableCell>{p.type.replace("_", " ")}</TableCell>
                      <TableCell>{formatCurrency(Number(p.amount))}</TableCell>
                      <TableCell>{formatCurrency(Number(p.amountPaid))}</TableCell>
                      <TableCell>
                        <Badge variant={paymentVariant[displayStatus] ?? "outline"}>{displayStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(p.dueDate)}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
