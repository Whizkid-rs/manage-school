import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/layout/role-guard"
import { OverdueBadge } from "@/components/payments/overdue-badge"
import { PaymentActions } from "@/components/payments/payment-actions"
import { cn, formatDate, formatCurrency } from "@/lib/utils"

function computeStatus(status: string, dueDate: Date) {
  if (status === "PENDING" && new Date(dueDate) < new Date()) return "OVERDUE"
  return status
}

const TYPE_LABELS: Record<string, string> = {
  TUITION: "Tuition",
  REGISTRATION: "Registration",
  EXAM_FEE: "Exam Fee",
  MATERIAL_FEE: "Material Fee",
  OTHER: "Other",
}

export default async function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { student: { include: { user: { select: { id: true, name: true } } } } },
  })

  if (!payment) notFound()

  const displayStatus = computeStatus(payment.status, payment.dueDate)
  const balance = Number(payment.amount) - Number(payment.amountPaid)

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-mono text-muted-foreground text-sm">{payment.invoiceNumber}</p>
          <h2 className="text-2xl font-bold mt-1">{TYPE_LABELS[payment.type] ?? payment.type}</h2>
        </div>
        <div className="flex gap-2">
          <Link href="/payments" className={buttonVariants({ variant: "outline" })}>Back</Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Amount</p>
            <p className="text-xl font-bold">{formatCurrency(Number(payment.amount), payment.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Paid</p>
            <p className="text-xl font-bold">{formatCurrency(Number(payment.amountPaid), payment.currency)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Balance</p>
            <p className={cn("text-xl font-bold", balance > 0 && "text-destructive")}>
              {formatCurrency(balance, payment.currency)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-muted-foreground">Status</p>
            <div className="mt-1"><OverdueBadge status={displayStatus} /></div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Details</CardTitle></CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Student</span>
            <RoleGuard roles={["ADMIN"]}>
              <Link href={`/students/${payment.student.id}`} className="hover:underline font-medium">
                {payment.student.user.name}
              </Link>
            </RoleGuard>
            <RoleGuard roles={["STUDENT"]}>
              <span className="font-medium">{payment.student.user.name}</span>
            </RoleGuard>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Due Date</span>
            <span>{formatDate(payment.dueDate)}</span>
          </div>
          {payment.paidAt && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Paid At</span>
              <span>{formatDate(payment.paidAt)}</span>
            </div>
          )}
          {payment.description && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Description</span>
              <span className="text-right">{payment.description}</span>
            </div>
          )}
          {payment.notes && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Notes</span>
              <span className="text-right">{payment.notes}</span>
            </div>
          )}
        </CardContent>
      </Card>

      <RoleGuard roles={["ADMIN"]}>
        <PaymentActions
          paymentId={id}
          currentStatus={displayStatus}
          amount={Number(payment.amount)}
          amountPaid={Number(payment.amountPaid)}
          currency={payment.currency}
          notes={payment.notes ?? undefined}
        />
      </RoleGuard>
    </div>
  )
}
