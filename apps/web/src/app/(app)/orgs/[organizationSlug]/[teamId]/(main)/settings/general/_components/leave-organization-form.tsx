'use client'

import { setActiveOrganizationTeam } from '@/actions/organizations'
import { authClient } from '@/lib/auth/client'
import { Button } from '@workspace/ui/components/button'
import { Spinner } from '@workspace/ui/components/spinner'
import { useRouter } from 'next/navigation'
import * as React from 'react'
import { toast } from 'sonner'

type Params = { organizationId: string }

export function LeaveOrganizationForm({ params }: { params: Params }) {
  const router = useRouter()

  const [isPending, startTransition] = React.useTransition()

  const onSubmit = async () => {
    startTransition(async () => {
      const { data, error } = await authClient.organization.leave({
        organizationId: params.organizationId,
      })

      if (data) {
        toast.success('You have left the organization')

        await setActiveOrganizationTeam()
        router.push('/')
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
          <h2 className="font-medium text-xl">Leave Organization</h2>
          <p className="text-muted-foreground text-sm">
            Revoke your access to this Organization. Any resources you've added
            to the Organization will remain.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-end space-x-4 rounded-b-lg border-destructive border-t bg-destructive/5 p-3 sm:px-10">
        <Button variant="destructive" onClick={onSubmit} disabled={isPending}>
          {isPending && <Spinner className="mr-2" />}
          Leave Organization
        </Button>
      </div>
    </div>
  )
}
