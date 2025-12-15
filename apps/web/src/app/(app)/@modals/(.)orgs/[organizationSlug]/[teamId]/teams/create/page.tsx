import { getMembership } from '@/actions/organizations'
import type { OrganizationTeamParams } from '@/lib/types'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { InterceptedDialogContent } from '@workspace/ui/components/intercepted-dialog-content'
import { Users2Icon } from 'lucide-react'
import { CreateTeamForm } from '../../../../../../orgs/[organizationSlug]/[teamId]/(main)/teams/(admin)/create/_components/create-team-form'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug } = await params

  const member = await getMembership({ organizationSlug })

  const isAdmin = member?.isAdmin

  if (!isAdmin) {
    return null
  }

  return (
    <Dialog defaultOpen>
      <InterceptedDialogContent>
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border">
            <Users2Icon className="size-6 text-muted-foreground" />
          </div>

          <DialogTitle className="text-center font-semibold text-xl leading-none">
            Create a team
          </DialogTitle>
        </DialogHeader>
        <div className="mt-5">
          <CreateTeamForm
            modal
            organizationSlug={organizationSlug}
            organizationId={member.organizationId}
          />
        </div>
      </InterceptedDialogContent>
    </Dialog>
  )
}
