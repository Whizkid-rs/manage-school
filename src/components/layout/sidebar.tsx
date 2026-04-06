"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import {
  LayoutDashboard,
  GraduationCap,
  BookOpen,
  Calendar,
  CreditCard,
  Users,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["ADMIN", "PROFESSOR", "STUDENT"],
  },
  {
    href: "/professors",
    label: "Professors",
    icon: GraduationCap,
    roles: ["ADMIN", "PROFESSOR"],
  },
  {
    href: "/courses",
    label: "Courses",
    icon: BookOpen,
    roles: ["ADMIN", "PROFESSOR", "STUDENT"],
  },
  {
    href: "/timetable",
    label: "Timetable",
    icon: Calendar,
    roles: ["ADMIN", "PROFESSOR", "STUDENT"],
  },
  {
    href: "/students",
    label: "Students",
    icon: Users,
    roles: ["ADMIN"],
  },
  {
    href: "/payments",
    label: "Payments",
    icon: CreditCard,
    roles: ["ADMIN", "STUDENT"],
  },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const role = session?.user?.role

  const visible = navItems.filter((item) =>
    role ? item.roles.includes(role) : false
  )

  return (
    <aside className="w-56 shrink-0 border-r bg-background flex flex-col min-h-screen">
      <div className="px-4 py-5 border-b">
        <span className="font-bold text-base tracking-tight">School Manager</span>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {visible.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/")
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
