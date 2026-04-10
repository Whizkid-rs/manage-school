"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Student = { id: string; user: { name: string; email: string }; studentNumber: string }

export default function AddMemberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [selectedId, setSelectedId] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    // Fetch students not yet in this group
    Promise.all([
      fetch("/api/students").then((r) => r.json()),
      fetch(`/api/groups/${groupId}`).then((r) => r.json()),
    ]).then(([allStudents, group]) => {
      const memberIds = new Set((group.memberships ?? []).map((m: { student: { id: string } }) => m.student.id))
      setStudents(allStudents.filter((s: Student) => !memberIds.has(s.id)))
    })
  }, [groupId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedId) { setError("Please select a student"); return }
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/groups/${groupId}/members`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: selectedId }),
    })
    setSubmitting(false)
    if (res.ok) {
      router.push(`/groups/${groupId}`)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to add student")
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <h2 className="text-2xl font-bold">Add Student to Group</h2>
      <Card>
        <CardHeader><CardTitle>Select Student</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="student">Student</Label>
              <Select onValueChange={(v) => setSelectedId(v ?? "")} value={selectedId}>
                <SelectTrigger id="student">
                  <SelectValue placeholder="Select a student..." />
                </SelectTrigger>
                <SelectContent>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.user.name} ({s.studentNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {students.length === 0 && (
                <p className="text-sm text-muted-foreground">All students are already in this group.</p>
              )}
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || students.length === 0}>
                {submitting ? "Adding..." : "Add Student"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/groups/${groupId}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
