import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { RoleGuard } from "@/components/layout/role-guard"
import { formatDate, cn } from "@/lib/utils"
import { Mail, Phone, DoorOpen, Calendar } from "lucide-react"

const employmentLabels = { FULL_TIME: "Full Time", PART_TIME: "Part Time", CONTRACT: "Contract" }

export default async function ProfessorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const professor = await prisma.professor.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true } },
      courseAssignments: { include: { course: true } },
      timetableSlots: { include: { course: true }, orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }] },
    },
  })

  if (!professor) notFound()

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">{professor.user.name}</h2>
          <p className="text-muted-foreground text-sm mt-1">{professor.department ?? "No department"}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/professors" className={buttonVariants({ variant: "outline" })}>Back</Link>
          <RoleGuard roles={["ADMIN"]}>
            <Link href={`/professors/${id}/edit`} className={buttonVariants()}>Edit</Link>
          </RoleGuard>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Contact & Details</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />{professor.user.email}
            </div>
            {professor.phone && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />{professor.phone}
              </div>
            )}
            {professor.officeRoom && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <DoorOpen className="h-4 w-4" />Room {professor.officeRoom}
              </div>
            )}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />Hired {formatDate(professor.hireDate)}
            </div>
            <Badge variant="outline">{employmentLabels[professor.employmentType]}</Badge>
          </CardContent>
        </Card>

        {professor.bio && (
          <Card>
            <CardHeader><CardTitle className="text-base">Bio</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">{professor.bio}</p></CardContent>
          </Card>
        )}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Courses ({professor.courseAssignments.length})</CardTitle></CardHeader>
        <CardContent>
          {professor.courseAssignments.length === 0 ? (
            <p className="text-sm text-muted-foreground">No courses assigned.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {professor.courseAssignments.map((a) => (
                <Link key={a.id} href={`/courses/${a.course.id}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-secondary/80">
                    {a.course.code} — {a.course.name}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {professor.timetableSlots.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Schedule</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {professor.timetableSlots.map((s) => (
                <div key={s.id} className="flex items-center gap-3 text-sm">
                  <span className="w-24 font-medium capitalize">{s.dayOfWeek.toLowerCase()}</span>
                  <span className="text-muted-foreground">{s.startTime} – {s.endTime}</span>
                  <span>{s.course.name}</span>
                  <Badge variant="outline" className="ml-auto">{s.room}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
