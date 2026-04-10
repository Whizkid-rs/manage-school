"use client"

import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { type Resolver } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useState, useEffect, use } from "react"

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  academicYear: z.string().optional(),
})

type FormData = {
  name: string
  description?: string
  academicYear?: string
}

export default function EditGroupPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
  })

  useEffect(() => {
    fetch(`/api/groups/${id}`)
      .then((r) => r.json())
      .then((data) => reset({ name: data.name, description: data.description ?? "", academicYear: data.academicYear ?? "" }))
  }, [id, reset])

  async function onSubmit(data: FormData) {
    setError(null)
    const res = await fetch(`/api/groups/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
    if (res.ok) {
      router.push(`/groups/${id}`)
    } else {
      setError("Failed to save changes")
    }
  }

  return (
    <div className="space-y-4 max-w-lg">
      <h2 className="text-2xl font-bold">Edit Group</h2>
      <Card>
        <CardHeader><CardTitle>Group Details</CardTitle></CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="academicYear">Academic Year</Label>
              <Input id="academicYear" {...register("academicYear")} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" {...register("description")} rows={3} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex gap-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Saving..." : "Save Changes"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.push(`/groups/${id}`)}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
