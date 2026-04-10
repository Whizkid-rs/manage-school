"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function RemoveMemberButton({
  groupId,
  studentId,
  studentName,
}: {
  groupId: string
  studentId: string
  studentName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    if (!confirm(`Remove ${studentName} from this group?`)) return
    setLoading(true)
    await fetch(`/api/groups/${groupId}/members/${studentId}`, { method: "DELETE" })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemove} disabled={loading}>
      {loading ? "Removing..." : "Remove"}
    </Button>
  )
}
