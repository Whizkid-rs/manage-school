"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { studentSchema, studentUpdateSchema, type StudentFormData, type StudentUpdateFormData } from "@/lib/validations/student"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StudentFormProps {
  defaultValues?: Partial<StudentFormData>
  studentId?: string
}

export function StudentForm({ defaultValues, studentId }: StudentFormProps) {
  const router = useRouter()
  const isEditing = !!studentId

  const schema = isEditing ? studentUpdateSchema : studentSchema

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<StudentFormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: defaultValues ?? {},
  })

  const onSubmit = async (data: StudentFormData | StudentUpdateFormData) => {
    const url = isEditing ? `/api/students/${studentId}` : "/api/students"
    const method = isEditing ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(typeof err.error === "string" ? err.error : "Something went wrong")
      return
    }

    toast.success(isEditing ? "Student updated" : "Student created")
    router.push("/students")
    router.refresh()
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Student" : "New Student"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit as any)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} placeholder="Alice Johnson" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">
                Email {isEditing && <span className="text-muted-foreground">(read-only)</span>}
              </Label>
              <Input
                id="email"
                type="email"
                {...register("email" as any)}
                placeholder="alice@student.com"
                disabled={isEditing}
              />
              {"email" in errors && errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="studentNumber">
                Student Number {isEditing && <span className="text-muted-foreground">(read-only)</span>}
              </Label>
              <Input
                id="studentNumber"
                {...register("studentNumber" as any)}
                placeholder="STU001"
                disabled={isEditing}
              />
              {"studentNumber" in errors && errors.studentNumber && (
                <p className="text-xs text-destructive">{(errors as any).studentNumber.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="grade">Grade / Year</Label>
              <Input id="grade" {...register("grade")} placeholder="Year 2" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="dateOfBirth">Date of Birth</Label>
              <Input id="dateOfBirth" type="date" {...register("dateOfBirth")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="guardianName">Guardian Name</Label>
              <Input id="guardianName" {...register("guardianName")} placeholder="Robert Johnson" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="guardianPhone">Guardian Phone</Label>
            <Input id="guardianPhone" {...register("guardianPhone")} placeholder="+1 555-0100" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="address">Address</Label>
            <Textarea id="address" {...register("address")} placeholder="123 Main St, City, State" rows={2} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Student"}
            </Button>
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
