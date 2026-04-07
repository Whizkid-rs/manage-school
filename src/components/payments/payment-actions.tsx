"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { paymentUpdateSchema, type PaymentUpdateFormData } from "@/lib/validations/payment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Resolver } from "react-hook-form"

interface PaymentActionsProps {
  paymentId: string
  currentStatus: string
  amount: number
  amountPaid: number
  currency: string
  notes?: string
}

export function PaymentActions({ paymentId, currentStatus, amount, amountPaid, currency, notes }: PaymentActionsProps) {
  const router = useRouter()
  const [status, setStatus] = useState(currentStatus === "OVERDUE" ? "OVERDUE" : currentStatus)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<PaymentUpdateFormData>({
    resolver: zodResolver(paymentUpdateSchema) as Resolver<PaymentUpdateFormData>,
    defaultValues: {
      amountPaid,
      status: currentStatus === "OVERDUE" ? "OVERDUE" : (currentStatus as PaymentUpdateFormData["status"]),
      notes,
    },
  })

  const onSubmit = async (data: PaymentUpdateFormData) => {
    const res = await fetch(`/api/payments/${paymentId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      toast.error(typeof err.error === "string" ? err.error : "Something went wrong")
      return
    }
    toast.success("Payment updated")
    router.refresh()
  }

  const markPaid = async () => {
    setValue("amountPaid", amount)
    setValue("status", "PAID")
    setStatus("PAID")
  }

  return (
    <Card>
      <CardHeader><CardTitle className="text-base">Update Payment</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="amountPaid">Amount Paid ({currency})</Label>
              <Input id="amountPaid" type="number" step="0.01" min="0" {...register("amountPaid")} />
              {errors.amountPaid && <p className="text-xs text-destructive">{errors.amountPaid.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => {
                  if (v) {
                    setStatus(v as string)
                    setValue("status", v as PaymentUpdateFormData["status"])
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="PARTIAL">Partial</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="CANCELLED">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" {...register("notes")} rows={2} placeholder="Internal notes..." />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
            {currentStatus !== "PAID" && (
              <Button type="button" variant="outline" onClick={markPaid}>
                Mark as Paid in Full
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
