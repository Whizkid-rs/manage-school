"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { professorSchema, type ProfessorFormData } from "@/lib/validations/professor"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ProfessorFormProps {
  defaultValues?: Partial<ProfessorFormData>
  professorId?: string
}

export function ProfessorForm({ defaultValues, professorId }: ProfessorFormProps) {
  const router = useRouter()
  const isEditing = !!professorId

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      employmentType: "FULL_TIME",
      ...defaultValues,
    },
  })

  const onSubmit = async (data: ProfessorFormData) => {
    const url = isEditing ? `/api/professors/${professorId}` : "/api/professors"
    const method = isEditing ? "PUT" : "POST"

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })

    if (!res.ok) {
      const err = await res.json()
      toast.error(err.error ?? "Something went wrong")
      return
    }

    toast.success(isEditing ? "Professor updated" : "Professor created")
    router.push("/professors")
    router.refresh()
  }

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle>{isEditing ? "Edit Professor" : "New Professor"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" {...register("name")} placeholder="Jane Smith" />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="email">Email {isEditing && <span className="text-muted-foreground">(read-only)</span>}</Label>
              <Input id="email" type="email" {...register("email")} placeholder="jane@school.com" disabled={isEditing} />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register("phone")} placeholder="+1 555-0100" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hireDate">Hire Date</Label>
              <Input id="hireDate" type="date" {...register("hireDate")} />
              {errors.hireDate && <p className="text-xs text-destructive">{errors.hireDate.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Employment Type</Label>
              <Select
                defaultValue={watch("employmentType")}
                onValueChange={(v) => setValue("employmentType", v as any)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FULL_TIME">Full Time</SelectItem>
                  <SelectItem value="PART_TIME">Part Time</SelectItem>
                  <SelectItem value="CONTRACT">Contract</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="department">Department</Label>
              <Input id="department" {...register("department")} placeholder="Mathematics" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="officeRoom">Office Room</Label>
            <Input id="officeRoom" {...register("officeRoom")} placeholder="B-201" />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">Bio</Label>
            <Textarea id="bio" {...register("bio")} placeholder="Brief description..." rows={3} />
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Professor"}
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
