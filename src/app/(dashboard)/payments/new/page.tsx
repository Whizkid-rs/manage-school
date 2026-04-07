"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { toast } from "sonner"
import { paymentSchema, type PaymentFormData } from "@/lib/validations/payment"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Resolver } from "react-hook-form"

interface Student {
  id: string
  studentNumber: string
  user: { name: string }
}

const TYPE_LABELS: Record<string, string> = {
  TUITION: "Tuition",
  REGISTRATION: "Registration",
  EXAM_FEE: "Exam Fee",
  MATERIAL_FEE: "Material Fee",
  OTHER: "Other",
}

export default function NewPaymentPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])

  useEffect(() => {
    fetch("/api/students").then((r) => r.json()).then(setStudents)
  }, [])

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<PaymentFormData>({
    resolver: zodResolver(paymentSchema) as Resolver<PaymentFormData>,
    defaultValues: { type: "TUITION", currency: "USD" },
  })

  const onSubmit = async (data: PaymentFormData) => {
    const res = await fetch("/api/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (!res.ok) {
      const err = await res.json()
      toast.error(typeof err.error === "string" ? err.error : "Something went wrong")
      return
    }
    toast.success("Payment created")
    router.push("/payments")
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">New Payment</h2>
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>Invoice Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label>Student</Label>
              <Select onValueChange={(v) => setValue("studentId", v as string)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id as string}>
                      {s.user.name} ({s.studentNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.studentId && <p className="text-xs text-destructive">{errors.studentId.message}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Payment Type</Label>
                <Select defaultValue="TUITION" onValueChange={(v) => setValue("type", v as PaymentFormData["type"])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency">Currency</Label>
                <Input id="currency" {...register("currency")} placeholder="USD" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="amount">Amount</Label>
                <Input id="amount" type="number" step="0.01" min="0" {...register("amount")} placeholder="0.00" />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input id="dueDate" type="date" {...register("dueDate")} />
                {errors.dueDate && <p className="text-xs text-destructive">{errors.dueDate.message}</p>}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} placeholder="Spring semester tuition..." />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" {...register("notes")} placeholder="Internal notes..." rows={2} />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating..." : "Create Payment"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
