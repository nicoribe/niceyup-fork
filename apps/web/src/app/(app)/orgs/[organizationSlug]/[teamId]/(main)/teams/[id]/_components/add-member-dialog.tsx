'use client'

import type { OrganizationTeamParams } from '@/lib/types'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'

type Params = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  teamId: string
}

export function AddMemberDialog({
  params,
  open,
  onOpenChange,
}: {
  params: Params
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
