'use client'

import { updateTag } from '@/actions/cache'
import { authClient } from '@/lib/auth/client'
import type { OrganizationTeamParams } from '@/lib/types'
import { Button } from '@workspace/ui/components/button'
import { Spinner } from '@workspace/ui/components/spinner'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

type Params = {
  organizationSlug: OrganizationTeamParams['organizationSlug']
  organizationId: string
  teamId: string
}

export function DeleteTeamForm({ params }: { params: Params }) {
  const router = useRouter()

  const [isPending, startTransition] = React.useTransition()

  const onSubmit = async () => {
    startTransition(async () => {
      const { data, error } = await authClient.organization.removeTeam({
        organizationId: params.organizationId,
        teamId: params.teamId,
      })

      if (data) {
        toast.success('Team deleted successfully')

        router.push(`/orgs/${params.organizationSlug}/~/teams`)

        await updateTag('delete-team')
      }

      if (error) {
        toast.error(error.message)
      }
    })
  }

  return (
    <div className="rounded-lg border border-destructive bg-background">
      <div className="relative flex flex-col space-y-6 p-5 sm:p-10">
        <div className="flex flex-col space-y-3">
          <h2 className="font-medium text-xl">Delete Team</h2>
          <p className="text-muted-foreground text-sm">
            Permanently remove your team from the Niceyup platform. This action
            is not reversible — please continue with caution.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-4 rounded-b-lg border-destructive border-t bg-destructive/5 p-3 sm:px-10">
        <Button variant="destructive" onClick={onSubmit} disabled={isPending}>
          {isPending && <Spinner className="mr-2" />}
          Delete Team
        </Button>
      </div>
    </div>
  )
}
