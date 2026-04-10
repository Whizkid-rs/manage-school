"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"

export function RemoveCourseButton({
  groupId,
  courseId,
  courseName,
}: {
  groupId: string
  courseId: string
  courseName: string
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    if (!confirm(`Remove ${courseName} from this group?`)) return
    setLoading(true)
    await fetch(`/api/groups/${groupId}/courses/${courseId}`, { method: "DELETE" })
    setLoading(false)
    router.refresh()
  }

  return (
    <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={handleRemove} disabled={loading}>
      {loading ? "Removing..." : "Remove"}
    </Button>
  )
}
