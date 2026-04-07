"use client"

import { useForm, Controller, type Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { courseSchema, type CourseFormData } from "@/lib/validations/course"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface CourseFormProps {
  defaultValues?: Partial<CourseFormData>
  courseId?: string
  allCourses: { id: string; code: string; name: string }[]
  allProfessors: { id: string; name: string }[]
}

export function CourseForm({ defaultValues, courseId, allCourses, allProfessors }: CourseFormProps) {
  const router = useRouter()
  const isEditing = !!courseId

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema) as Resolver<CourseFormData>,
    defaultValues: {
      credits: 3,
      maxStudents: 30,
      isActive: true,
      prerequisiteIds: [],
      professorIds: [],
      ...defaultValues,
    },
  })

  const onSubmit = async (data: CourseFormData) => {
    const url = isEditing ? `/api/courses/${courseId}` : "/api/courses"
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

    toast.success(isEditing ? "Course updated" : "Course created")
    router.push("/courses")
    router.refresh()
  }

  const otherCourses = allCourses.filter((c) => c.id !== courseId)

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Course" : "New Course"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="code">Course Code</Label>
              <Input id="code" {...register("code")} placeholder="MATH101" disabled={isEditing} />
              {errors.code && <p className="text-xs text-destructive">{errors.code.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="name">Course Name</Label>
              <Input id="name" {...register("name")} placeholder="Introduction to Calculus" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...register("description")} placeholder="Brief course description..." rows={3} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="credits">Credits</Label>
              <Input id="credits" type="number" min={1} max={10} {...register("credits")} />
              {errors.credits && <p className="text-xs text-destructive">{errors.credits.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxStudents">Max Students</Label>
              <Input id="maxStudents" type="number" min={1} {...register("maxStudents")} />
              {errors.maxStudents && <p className="text-xs text-destructive">{errors.maxStudents.message}</p>}
            </div>
          </div>

          {allProfessors.length > 0 && (
            <div className="space-y-1.5">
              <Label>Assigned Professors</Label>
              <Controller
                control={control}
                name="professorIds"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                    {allProfessors.map((p) => (
                      <label key={p.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value.includes(p.id)}
                          onChange={(e) =>
                            field.onChange(
                              e.target.checked
                                ? [...field.value, p.id]
                                : field.value.filter((id) => id !== p.id)
                            )
                          }
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
          )}

          {otherCourses.length > 0 && (
            <div className="space-y-1.5">
              <Label>Prerequisites</Label>
              <Controller
                control={control}
                name="prerequisiteIds"
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                    {otherCourses.map((c) => (
                      <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={field.value.includes(c.id)}
                          onChange={(e) =>
                            field.onChange(
                              e.target.checked
                                ? [...field.value, c.id]
                                : field.value.filter((id) => id !== c.id)
                            )
                          }
                        />
                        {c.code} — {c.name}
                      </label>
                    ))}
                  </div>
                )}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input type="checkbox" id="isActive" {...register("isActive")} />
            <Label htmlFor="isActive">Active</Label>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Course"}
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
