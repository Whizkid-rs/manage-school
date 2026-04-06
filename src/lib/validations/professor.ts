import { z } from "zod"

export const professorSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  bio: z.string().optional(),
  hireDate: z.string().min(1, "Hire date is required"),
  employmentType: z.enum(["FULL_TIME", "PART_TIME", "CONTRACT"]),
  department: z.string().optional(),
  officeRoom: z.string().optional(),
})

export type ProfessorFormData = z.infer<typeof professorSchema>
