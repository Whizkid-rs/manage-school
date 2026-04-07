import { prisma } from "@/lib/prisma"
import { CourseForm } from "@/components/courses/course-form"

export default async function NewCoursePage() {
  const [courses, professors] = await Promise.all([
    prisma.course.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
    prisma.professor.findMany({ include: { user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
  ])

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">New Course</h2>
      <CourseForm
        allCourses={courses}
        allProfessors={professors.map((p) => ({ id: p.id, name: p.user.name }))}
      />
    </div>
  )
}
