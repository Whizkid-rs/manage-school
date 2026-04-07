"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

interface Student {
  id: string
  studentNumber: string
  user: { name: string }
}

export default function EnrollStudentPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const courseId = params.id

  const [students, setStudents] = useState<Student[]>([])
  const [selectedStudentId, setSelectedStudentId] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    fetch("/api/students")
      .then((r) => r.json())
      .then(setStudents)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStudentId) {
      toast.error("Please select a student")
      return
    }
    setIsSubmitting(true)
    const res = await fetch(`/api/courses/${courseId}/enrollments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId: selectedStudentId }),
    })
    setIsSubmitting(false)
    if (!res.ok) {
      const err = await res.json()
      toast.error(typeof err.error === "string" ? err.error : "Something went wrong")
      return
    }
    toast.success("Student enrolled")
    router.push(`/courses/${courseId}`)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Enroll Student</h2>
      <Card className="max-w-md">
        <CardHeader><CardTitle>Select Student</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="student">Student</Label>
              <select
                id="student"
                className="w-full border rounded-md px-3 py-2 text-sm bg-background"
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
              >
                <option value="">Select a student...</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.user.name} ({s.studentNumber})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Enrolling..." : "Enroll"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
