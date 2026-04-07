import { Badge } from "@/components/ui/badge"

const variant: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  PAID: "default",
  PARTIAL: "secondary",
  PENDING: "secondary",
  OVERDUE: "destructive",
  CANCELLED: "outline",
}

export function OverdueBadge({ status }: { status: string }) {
  return <Badge variant={variant[status] ?? "outline"}>{status}</Badge>
}
