import { prisma } from "@/lib/prisma"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { RoleGuard } from "@/components/layout/role-guard"
import { OverdueBadge } from "@/components/payments/overdue-badge"
import { Plus } from "lucide-react"
import { cn, formatDate, formatCurrency } from "@/lib/utils"

function computeStatus(status: string, dueDate: Date) {
  if (status === "PENDING" && new Date(dueDate) < new Date()) return "OVERDUE"
  return status
}

export default async function PaymentsPage() {
  const session = await getServerSession(authOptions)

  const where = session?.user.role === "STUDENT" && session.user.studentId
    ? { studentId: session.user.studentId }
    : {}

  const payments = await prisma.payment.findMany({
    where,
    include: { student: { include: { user: { select: { name: true } } } } },
    orderBy: { dueDate: "desc" },
  })

  const withStatus = payments.map((p) => ({ ...p, displayStatus: computeStatus(p.status, p.dueDate) }))
  const overdueCount = withStatus.filter((p) => p.displayStatus === "OVERDUE").length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments</h2>
          <p className="text-muted-foreground text-sm">
            {payments.length} total{overdueCount > 0 && ` · ${overdueCount} overdue`}
          </p>
        </div>
        <RoleGuard roles={["ADMIN"]}>
          <Link href="/payments/new" className={cn(buttonVariants(), "gap-2")}>
            <Plus className="h-4 w-4" />
            New Payment
          </Link>
        </RoleGuard>
      </div>

      <div className="rounded-md border bg-background">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Paid</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {withStatus.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No payments yet.
                </TableCell>
              </TableRow>
            )}
            {withStatus.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-mono text-sm">
                  <Link href={`/payments/${p.id}`} className="hover:underline">{p.invoiceNumber}</Link>
                </TableCell>
                <TableCell>
                  <RoleGuard roles={["ADMIN"]}>
                    <Link href={`/students/${p.student.id}`} className="hover:underline">
                      {p.student.user.name}
                    </Link>
                  </RoleGuard>
                  <RoleGuard roles={["STUDENT"]}>
                    {p.student.user.name}
                  </RoleGuard>
                </TableCell>
                <TableCell className="text-sm">{p.type.replace("_", " ")}</TableCell>
                <TableCell>{formatCurrency(Number(p.amount), p.currency)}</TableCell>
                <TableCell>{formatCurrency(Number(p.amountPaid), p.currency)}</TableCell>
                <TableCell><OverdueBadge status={p.displayStatus} /></TableCell>
                <TableCell className="text-muted-foreground text-sm">{formatDate(p.dueDate)}</TableCell>
                <TableCell>
                  <RoleGuard roles={["ADMIN"]}>
                    <Link href={`/payments/${p.id}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
                      View
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
