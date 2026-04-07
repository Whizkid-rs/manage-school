import { z } from "zod"

export const paymentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
  type: z.enum(["TUITION", "REGISTRATION", "EXAM_FEE", "MATERIAL_FEE", "OTHER"]),
  amount: z.coerce.number().positive("Amount must be positive"),
  currency: z.string().default("USD"),
  dueDate: z.string().min(1, "Due date is required"),
  description: z.string().optional(),
  notes: z.string().optional(),
})

export const paymentUpdateSchema = z.object({
  amountPaid: z.coerce.number().min(0, "Amount paid cannot be negative"),
  status: z.enum(["PENDING", "PAID", "OVERDUE", "CANCELLED", "PARTIAL"]),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
})

export type PaymentFormData = {
  studentId: string
  type: "TUITION" | "REGISTRATION" | "EXAM_FEE" | "MATERIAL_FEE" | "OTHER"
  amount: number
  currency: string
  dueDate: string
  description?: string
  notes?: string
}

export type PaymentUpdateFormData = {
  amountPaid: number
  status: "PENDING" | "PAID" | "OVERDUE" | "CANCELLED" | "PARTIAL"
  paidAt?: string
  notes?: string
}
