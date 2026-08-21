import { Badge } from "@texnomart/ui/badge"
import { cn } from "@texnomart/ui/utils"
import { APPLICATION_STATUS_META, type ApplicationStatus } from "@/lib/alif-application"

export interface ApplicationStatusBadgeProps {
  status: ApplicationStatus
  className?: string
}

// Бейдж статуса заявки (§5 ТЗ). Оформление берётся из APPLICATION_STATUS_META,
// чтобы подпись и цвет совпадали везде, где статус показывается.
export function ApplicationStatusBadge({ status, className }: ApplicationStatusBadgeProps) {
  const meta = APPLICATION_STATUS_META[status]
  return (
    <Badge className={cn("border-transparent hover:bg-inherit", meta.className, className)}>
      {meta.label}
    </Badge>
  )
}
