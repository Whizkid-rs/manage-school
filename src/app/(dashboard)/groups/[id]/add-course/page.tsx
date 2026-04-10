"use client"

import { useRouter } from "next/navigation"
import { useState, useEffect, use } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Course = { id: string; code: string; name: string }
type Professor = { id: string; user: { name: string } }

export default function AddCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id: groupId } = use(params)
  const router = useRouter()
  const [courses, setCourses] = useState<Course[]>([])
  const [professors, setProfessors] = useState<Professor[]>([])
  const [selectedCourse, setSelectedCourse] = useState("")
  const [selectedProfessor, setSelectedProfessor] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch("/api/courses").then((r) => r.json()),
      fetch("/api/professors").then((r) => r.json()),
      fetch(`/api/groups/${groupId}`).then((r) => r.json()),
    ]).then(([allCourses, allProfessors, group]) => {
      const assignedIds = new Set((group.courses ?? []).map((gc: { course: { id: string } }) => gc.course.id))
      setCourses(allCourses.filter((c: Course) => !assignedIds.has(c.id)))
      setProfessors(allProfessors)
    })
  }, [groupId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCourse) { setError("Please select a course"); return }
    if (!selectedProfessor) { setError("Please select a professor"); return }
    setSubmitting(true)
    setError(null)
    const res = await fetch(`/api/groups/${groupId}/courses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: selectedCourse, professorId: selectedProfessor }),
    })
    setSubmitting(false)
    if (res.ok) {
      router.push(`/groups/${groupId}`)
    } else {
      const data = await res.json()
      setError(data.error ?? "Failed to assign course")
    }
  }

  return (
    <div className="space-y-4 max-w-md">
      <h2 className="text-2xl font-bold">Assign Course to Group</h2>
      <Card>
        <CardHeader><CardTitle>Select Course &amp; Professor</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="course">Course</Label>
              <Select onValueChange={(v) => setSelectedCourse(v ?? "")} value={selectedCourse}>
                <SelectTrigger id="course">
                  <SelectValue placeholder="Select a course..." />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {courses.length === 0 && (
                <p className="text-sm text-muted-foreground">All courses are already assigned to this group.</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="professor">Professor</Label>
              <Select onValueChange={(v) => setSelectedProfessor(v ?? "")} value={selectedProfessor}>
                <SelectTrigger id="professor">
                  <SelectValue placeholder="Select a professor..." />
                </SelectTrigger>
                <SelectContent>
                  {professors.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.user.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={submitting || courses.length === 0}>
                {submitting ? "Assigning..." : "Assign Course"}
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
