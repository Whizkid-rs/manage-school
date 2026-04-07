import { z } from "zod"

export const studentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  studentNumber: z.string().min(1, "Student number is required"),
  grade: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
})

export const studentUpdateSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  grade: z.string().optional(),
  dateOfBirth: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  address: z.string().optional(),
})

export type StudentFormData = z.infer<typeof studentSchema>
export type StudentUpdateFormData = z.infer<typeof studentUpdateSchema>
