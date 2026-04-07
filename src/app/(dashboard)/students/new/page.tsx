import { StudentForm } from "@/components/students/student-form"

export default function NewStudentPage() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">New Student</h2>
      <StudentForm />
    </div>
  )
}
