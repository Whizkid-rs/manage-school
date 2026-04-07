import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { CourseForm } from "@/components/courses/course-form"

export default async function EditCoursePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const [course, allCourses, professors] = await Promise.all([
    prisma.course.findUnique({
      where: { id },
      include: {
        prerequisites: { select: { id: true } },
        assignments: { select: { professorId: true } },
      },
    }),
    prisma.course.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: "asc" } }),
    prisma.professor.findMany({ include: { user: { select: { name: true } } }, orderBy: { user: { name: "asc" } } }),
  ])

  if (!course) notFound()

  const defaultValues = {
    code: course.code,
    name: course.name,
    description: course.description ?? undefined,
    credits: course.credits,
    maxStudents: course.maxStudents,
    isActive: course.isActive,
    prerequisiteIds: course.prerequisites.map((p) => p.id),
    professorIds: course.assignments.map((a) => a.professorId),
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit Course</h2>
      <CourseForm
        defaultValues={defaultValues}
        courseId={id}
        allCourses={allCourses}
        allProfessors={professors.map((p) => ({ id: p.id, name: p.user.name }))}
      />
    </div>
  )
}
