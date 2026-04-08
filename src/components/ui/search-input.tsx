"use client"

import { useRouter, useSearchParams, usePathname } from "next/navigation"
import { useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface SearchInputProps {
  placeholder?: string
  paramName?: string
}

export function SearchInput({ placeholder = "Search...", paramName = "q" }: SearchInputProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const params = new URLSearchParams(searchParams.toString())
      if (e.target.value) {
        params.set(paramName, e.target.value)
      } else {
        params.delete(paramName)
      }
      router.replace(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams, paramName],
  )

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        className="pl-8 w-64"
        placeholder={placeholder}
        defaultValue={searchParams.get(paramName) ?? ""}
        onChange={handleChange}
      />
    </div>
  )
}
