import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { StudentForm } from "@/components/students/student-form"

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  const student = await prisma.student.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  })

  if (!student) notFound()

  const defaultValues = {
    name: student.user.name,
    email: student.user.email,
    studentNumber: student.studentNumber,
    grade: student.grade ?? undefined,
    dateOfBirth: student.dateOfBirth
      ? new Date(student.dateOfBirth).toISOString().split("T")[0]
      : undefined,
    guardianName: student.guardianName ?? undefined,
    guardianPhone: student.guardianPhone ?? undefined,
    address: student.address ?? undefined,
  }

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit Student</h2>
      <StudentForm defaultValues={defaultValues} studentId={id} />
    </div>
  )
}
