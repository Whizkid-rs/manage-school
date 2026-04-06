"use client"

import { useSession } from "next-auth/react"
import type { Role } from "@prisma/client"

interface RoleGuardProps {
  roles: Role[]
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGuard({ roles, children, fallback = null }: RoleGuardProps) {
  const { data: session } = useSession()
  if (!session || !roles.includes(session.user.role as Role)) return <>{fallback}</>
  return <>{children}</>
}
