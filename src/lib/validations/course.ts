import { z } from "zod"

export const courseSchema = z.object({
  code: z.string().min(2, "Course code is required"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  description: z.string().optional(),
  credits: z.coerce.number().int().min(1).max(10),
  maxStudents: z.coerce.number().int().min(1).max(500),
  pricePerMonth: z.coerce.number().min(0).optional(),
  isActive: z.boolean().default(true),
  prerequisiteIds: z.array(z.string()).default([]),
  professorIds: z.array(z.string()).default([]),
})

export const enrollmentSchema = z.object({
  studentId: z.string().min(1, "Student is required"),
})

export type CourseFormData = {
  code: string
  name: string
  description?: string
  credits: number
  maxStudents: number
  pricePerMonth?: number
  isActive: boolean
  prerequisiteIds: string[]
  professorIds: string[]
}
