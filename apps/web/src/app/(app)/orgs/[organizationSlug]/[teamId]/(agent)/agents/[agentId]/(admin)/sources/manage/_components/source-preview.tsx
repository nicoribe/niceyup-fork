'use client'

import type { AgentParams, OrganizationTeamParams } from '@/lib/types'
import { cn } from '@workspace/ui/lib/utils'

type Params = OrganizationTeamParams & AgentParams

export function SourcePreview({
  selectedSourceId,
  className,
  ...props
}: React.ComponentProps<'div'> & {
  params: Params
  selectedSourceId: string
}) {
  return (
    <div className={cn(className)} {...props}>
      <p className="py-6 text-center text-muted-foreground text-xs">
        Coming soon ({selectedSourceId})
      </p>
    </div>
  )
}
