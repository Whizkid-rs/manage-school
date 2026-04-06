import { Role } from "@prisma/client"
import "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: Role
      professorId: string | null
      studentId: string | null
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: Role
    professorId: string | null
    studentId: string | null
  }
}
