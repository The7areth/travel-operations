import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const styles: Record<string, string> = {
  Draft: 'border-[#b8963e]/40 bg-[#f5edd6] text-[#b8963e]',
  Sent: 'border-blue-200 bg-blue-50 text-blue-700',
  Accepted: 'border-green-200 bg-green-50 text-green-700',
}

export function StatusBadge({ status }: { status: 'Draft' | 'Sent' | 'Accepted' }) {
  return (
    <Badge variant="outline" className={cn('text-xs font-medium tracking-wide', styles[status])}>
      {status}
    </Badge>
  )
}
