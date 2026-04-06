import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { GraduationCap, BookOpen, Users, CreditCard } from "lucide-react"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const role = session.user.role

  // Fetch KPI data based on role
  const [professorCount, courseCount, studentCount, overdueCount] =
    role === "ADMIN"
      ? await Promise.all([
          prisma.professor.count(),
          prisma.course.count({ where: { isActive: true } }),
          prisma.student.count(),
          prisma.payment.count({
            where: { status: "OVERDUE" },
          }),
        ])
      : [0, 0, 0, 0]

  const professorCards = [
    { title: "Professors", value: professorCount, icon: GraduationCap, href: "/professors" },
    { title: "Active Courses", value: courseCount, icon: BookOpen, href: "/courses" },
    { title: "Students", value: studentCount, icon: Users, href: "/students" },
    { title: "Overdue Payments", value: overdueCount, icon: CreditCard, href: "/payments", alert: overdueCount > 0 },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Welcome back, {session.user.name.split(" ")[0]}</h2>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {role === "ADMIN" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {professorCards.map((card) => (
            <Card key={card.title} className={card.alert ? "border-destructive" : ""}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {card.title}
                </CardTitle>
                <card.icon className={`h-4 w-4 ${card.alert ? "text-destructive" : "text-muted-foreground"}`} />
              </CardHeader>
              <CardContent>
                <p className={`text-3xl font-bold ${card.alert ? "text-destructive" : ""}`}>
                  {card.value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {role === "PROFESSOR" && (
        <Card>
          <CardHeader>
            <CardTitle>Your schedule</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Timetable module coming soon.</p>
          </CardContent>
        </Card>
      )}

      {role === "STUDENT" && (
        <Card>
          <CardHeader>
            <CardTitle>Your overview</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm">Courses and payments coming soon.</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
