'use client'

import { authClient } from '@/lib/auth/client'
import { Button } from '@workspace/ui/components/button'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

export function InitationActions({
  invitationId,
  organizationSlug,
}: {
  invitationId: string
  organizationSlug?: string | null
}) {
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const onAccept = async () => {
    startTransition(async () => {
      const { data, error } = await authClient.organization.acceptInvitation({
        invitationId,
      })

      if (data) {
        router.push(
          organizationSlug ? `/orgs/${organizationSlug}/~/overview` : '/',
        )
      }

      if (error) {
        toast.error(error.message)
      }
    })
  }

  const onDecline = async () => {
    startTransition(async () => {
      const { data, error } = await authClient.organization.rejectInvitation({
        invitationId,
      })

      if (data) {
        toast.success('Invitation declined successfully')

        router.push('/')
      }

      if (error) {
        toast.error(error.message)
      }
    })
  }

  return (
    <div className="mx-auto flex flex-row items-center justify-center gap-2">
      <Button onClick={onAccept} disabled={isPending}>
        Accept invitation
      </Button>
      <Button variant="outline" onClick={onDecline} disabled={isPending}>
        Decline invitation
      </Button>
    </div>
  )
}
