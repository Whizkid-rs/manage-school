"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Zap } from "lucide-react"
import { useRouter } from "next/navigation"

export function GenerateInvoicesButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const now = new Date()
  const [month, setMonth] = useState(String(now.getMonth() + 1))
  const [year, setYear] = useState(String(now.getFullYear()))
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    setResult(null)
    const res = await fetch("/api/invoices/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: Number(month), year: Number(year) }),
    })
    setLoading(false)
    if (res.ok) {
      const data = await res.json()
      setResult(data)
      router.refresh()
    } else {
      setError("Failed to generate invoices")
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setResult(null); setError(null) } }}>
      <DialogTrigger className="inline-flex items-center gap-2 shrink-0 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground">
        <Zap className="h-4 w-4" />
        Generate Monthly Invoices
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Generate Monthly Invoices</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Creates one invoice per student based on their group course fees. Students already invoiced for the period are skipped.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="inv-month">Month</Label>
              <Input
                id="inv-month"
                type="number"
                min={1}
                max={12}
                value={month}
                onChange={(e) => setMonth(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="inv-year">Year</Label>
              <Input
                id="inv-year"
                type="number"
                min={2000}
                max={2100}
                value={year}
                onChange={(e) => setYear(e.target.value)}
              />
            </div>
          </div>
          {result && (
            <p className="text-sm text-green-600 font-medium">
              {result.created} invoice{result.created !== 1 ? "s" : ""} created, {result.skipped} skipped.
            </p>
          )}
          {error && <p className="text-sm text-destructive">{error}</p>}
          <div className="flex gap-2">
            <Button onClick={handleGenerate} disabled={loading}>
              {loading ? "Generating..." : "Generate"}
            </Button>
            <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
