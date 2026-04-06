import { prisma } from "@/lib/prisma"
import { notFound } from "next/navigation"
import { ProfessorForm } from "@/components/professors/professor-form"

export default async function EditProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const professor = await prisma.professor.findUnique({
    where: { id },
    include: { user: { select: { name: true, email: true } } },
  })

  if (!professor) notFound()

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Edit Professor</h2>
      <ProfessorForm
        professorId={id}
        defaultValues={{
          name: professor.user.name,
          email: professor.user.email,
          phone: professor.phone ?? "",
          bio: professor.bio ?? "",
          hireDate: professor.hireDate.toISOString().split("T")[0],
          employmentType: professor.employmentType,
          department: professor.department ?? "",
          officeRoom: professor.officeRoom ?? "",
        }}
      />
    </div>
  )
}
