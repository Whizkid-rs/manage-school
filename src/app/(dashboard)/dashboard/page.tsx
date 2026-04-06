import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import { LogoutButton } from "@/components/logout-button"

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect("/login")

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="border-b bg-background px-6 py-3 flex items-center justify-between">
        <h1 className="font-semibold text-lg">School Management</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {session.user.name} · {session.user.role}
          </span>
          <LogoutButton />
        </div>
      </header>
      <main className="p-6">
        <p className="text-muted-foreground">Dashboard coming soon.</p>
      </main>
    </div>
  )
}
