import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { OverdueBadge } from "@/components/payments/overdue-badge"
import Link from "next/link"
import { GraduationCap, BookOpen, Users, CreditCard, AlertCircle } from "lucide-react"
import { formatCurrency, formatDate } from "@/lib/utils"

function computeStatus(status: string, dueDate: Date) {
  if (status === "PENDING" && new Date(dueDate) < new Date()) return "OVERDUE"
  return status
}

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const role = session.user.role

  // ─── ADMIN ────────────────────────────────────────────────────────────────
  if (role === "ADMIN") {
    const now = new Date()
    const currentMonth = now.getMonth() + 1
    const currentYear = now.getFullYear()

    const [professorCount, courseCount, studentCount, pendingPayments, groups] = await Promise.all([
      prisma.professor.count(),
      prisma.course.count({ where: { isActive: true } }),
      prisma.student.count(),
      prisma.payment.findMany({
        where: { status: { in: ["PENDING", "OVERDUE"] } },
        include: { student: { include: { user: { select: { name: true } } } } },
        orderBy: { dueDate: "asc" },
        take: 5,
      }),
      prisma.group.findMany({
        include: {
          memberships: { select: { studentId: true } },
        },
        orderBy: { name: "asc" },
      }),
    ])

    // Per-group payment status for current month
    const groupMemberIds = groups.map((g) => g.memberships.map((m) => m.studentId)).flat()
    const currentMonthPayments = await prisma.payment.findMany({
      where: {
        billingMonth: currentMonth,
        billingYear: currentYear,
        studentId: { in: groupMemberIds },
      },
      select: { studentId: true, status: true, dueDate: true },
    })
    const paidStudentIds = new Set(
      currentMonthPayments
        .filter((p) => computeStatus(p.status, p.dueDate) === "PAID")
        .map((p) => p.studentId)
    )

    const overdueCount = pendingPayments.filter(
      (p) => computeStatus(p.status, p.dueDate) === "OVERDUE",
    ).length

    const kpis = [
      { title: "Professors", value: professorCount, icon: GraduationCap, href: "/professors", alert: false },
      { title: "Active Courses", value: courseCount, icon: BookOpen, href: "/courses", alert: false },
      { title: "Students", value: studentCount, icon: Users, href: "/students", alert: false },
      { title: "Overdue Payments", value: overdueCount, icon: CreditCard, href: "/payments", alert: overdueCount > 0 },
    ]

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {session.user.name.split(" ")[0]}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((card) => (
            <Card key={card.title} className={card.alert ? "border-destructive" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
                <card.icon className={`h-4 w-4 ${card.alert ? "text-destructive" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${card.alert ? "text-destructive" : ""}`}>{card.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {groups.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Group Payment Status — {new Date(currentYear, currentMonth - 1).toLocaleString("en-US", { month: "long", year: "numeric" })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Group</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Outstanding</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groups.map((g) => {
                    const total = g.memberships.length
                    const paid = g.memberships.filter((m) => paidStudentIds.has(m.studentId)).length
                    const outstanding = total - paid
                    return (
                      <TableRow key={g.id}>
                        <TableCell className="font-medium">
                          <Link href={`/groups/${g.id}`} className="hover:underline">{g.name}</Link>
                        </TableCell>
                        <TableCell>{total}</TableCell>
                        <TableCell className="text-green-600 font-medium">{paid}</TableCell>
                        <TableCell className={outstanding > 0 ? "text-destructive font-medium" : "text-muted-foreground"}>
                          {outstanding}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {pendingPayments.length > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <CardTitle className="text-base">Pending &amp; Overdue Invoices</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">
                        <Link href={`/payments/${p.id}`} className="hover:underline">{p.invoiceNumber}</Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/students/${p.student.id}`} className="hover:underline">{p.student.user.name}</Link>
                      </TableCell>
                      <TableCell>{formatCurrency(Number(p.amount), p.currency)}</TableCell>
                      <TableCell><OverdueBadge status={computeStatus(p.status, p.dueDate)} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(p.dueDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // ─── PROFESSOR ────────────────────────────────────────────────────────────
  if (role === "PROFESSOR" && session.user.professorId) {
    const assignments = await prisma.courseAssignment.findMany({
      where: { professorId: session.user.professorId },
      include: {
        course: {
          include: {
            _count: { select: { enrollments: { where: { status: "ACTIVE" } } } },
          },
        },
      },
    })

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {session.user.name.split(" ")[0]}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your schedule</CardTitle>
          </CardHeader>
          <CardContent>
            {assignments.length === 0 ? (
              <p className="text-muted-foreground text-sm">You have no assigned courses.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Credits</TableHead>
                    <TableHead>Enrolled</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map(({ course }) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono font-medium">
                        <Link href={`/courses/${course.id}`} className="hover:underline">{course.code}</Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/courses/${course.id}`} className="hover:underline">{course.name}</Link>
                      </TableCell>
                      <TableCell>{course.credits}</TableCell>
                      <TableCell>{course._count.enrollments} / {course.maxStudents}</TableCell>
                      <TableCell>
                        <Badge variant={course.isActive ? "default" : "secondary"}>
                          {course.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
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

  // ─── STUDENT ──────────────────────────────────────────────────────────────
  if (role === "STUDENT" && session.user.studentId) {
    const [enrollments, payments] = await Promise.all([
      prisma.enrollment.findMany({
        where: { studentId: session.user.studentId, status: "ACTIVE" },
        include: { course: { select: { id: true, code: true, name: true, credits: true } } },
      }),
      prisma.payment.findMany({
        where: { studentId: session.user.studentId },
        orderBy: { dueDate: "desc" },
        take: 5,
      }),
    ])

    const totalBalance = payments.reduce(
      (acc, p) => acc + (Number(p.amount) - Number(p.amountPaid)),
      0,
    )
    const overduePayments = payments.filter((p) => computeStatus(p.status, p.dueDate) === "OVERDUE")

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Welcome back, {session.user.name.split(" ")[0]}</h2>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4">Your overview</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active Courses</CardTitle></CardHeader>
            <CardContent><p className="text-3xl font-bold">{enrollments.length}</p></CardContent>
          </Card>
          <Card className={overduePayments.length > 0 ? "border-destructive" : ""}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Overdue Invoices</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${overduePayments.length > 0 ? "text-destructive" : ""}`}>
                {overduePayments.length}
              </p>
            </CardContent>
          </Card>
          <Card className={totalBalance > 0 ? "border-destructive" : ""}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Balance Due</CardTitle></CardHeader>
            <CardContent>
              <p className={`text-3xl font-bold ${totalBalance > 0 ? "text-destructive" : ""}`}>
                {formatCurrency(totalBalance, "USD")}
              </p>
            </CardContent>
          </Card>
        </div>

        {enrollments.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Your Courses</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Credits</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrollments.map(({ course }) => (
                    <TableRow key={course.id}>
                      <TableCell className="font-mono font-medium">
                        <Link href={`/courses/${course.id}`} className="hover:underline">{course.code}</Link>
                      </TableCell>
                      <TableCell>
                        <Link href={`/courses/${course.id}`} className="hover:underline">{course.name}</Link>
                      </TableCell>
                      <TableCell>{course.credits}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {payments.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Recent Payments</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Due</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-sm">
                        <Link href={`/payments/${p.id}`} className="hover:underline">{p.invoiceNumber}</Link>
                      </TableCell>
                      <TableCell>{formatCurrency(Number(p.amount), p.currency)}</TableCell>
                      <TableCell>{formatCurrency(Number(p.amountPaid), p.currency)}</TableCell>
                      <TableCell><OverdueBadge status={computeStatus(p.status, p.dueDate)} /></TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDate(p.dueDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    )
  }

  // Fallback
  return (
    <div>
      <h2 className="text-2xl font-bold">Welcome back, {session.user.name.split(" ")[0]}</h2>
    </div>
  )
}
