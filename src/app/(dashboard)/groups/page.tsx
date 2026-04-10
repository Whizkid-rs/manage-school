import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import Link from "next/link"
import { buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RoleGuard } from "@/components/layout/role-guard"
import { Plus, Users, BookOpen } from "lucide-react"
import { cn } from "@/lib/utils"

export default async function GroupsPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  const role = session.user.role

  let groups
  if (role === "STUDENT" && session.user.studentId) {
    // Students see only groups they belong to
    groups = await prisma.group.findMany({
      where: { memberships: { some: { studentId: session.user.studentId } } },
      include: {
        _count: { select: { memberships: true, courses: true } },
      },
      orderBy: { name: "asc" },
    })
  } else {
    groups = await prisma.group.findMany({
      include: {
        _count: { select: { memberships: true, courses: true } },
      },
      orderBy: { name: "asc" },
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold">Groups</h2>
          <p className="text-muted-foreground text-sm">{groups.length} group{groups.length !== 1 ? "s" : ""}</p>
        </div>
        <RoleGuard roles={["ADMIN"]}>
          <Link href="/groups/new" className={cn(buttonVariants(), "gap-2 shrink-0")}>
            <Plus className="h-4 w-4" />
            New Group
          </Link>
        </RoleGuard>
      </div>

      {groups.length === 0 ? (
        <div className="rounded-md border bg-background p-12 text-center text-muted-foreground">
          No groups found.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {groups.map((group) => (
            <Link key={group.id} href={`/groups/${group.id}`} className="block">
              <Card className="hover:shadow-md transition-shadow h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{group.name}</CardTitle>
                  {group.academicYear && (
                    <Badge variant="outline" className="w-fit text-xs">{group.academicYear}</Badge>
                  )}
                </CardHeader>
                <CardContent className="space-y-2">
                  {group.description && (
                    <p className="text-sm text-muted-foreground">{group.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="h-3.5 w-3.5" />
                      {group._count.memberships} student{group._count.memberships !== 1 ? "s" : ""}
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {group._count.courses} course{group._count.courses !== 1 ? "s" : ""}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
