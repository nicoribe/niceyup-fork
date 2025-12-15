import { getMembership } from '@/actions/organizations'
import type { OrganizationTeamParams } from '@/lib/types'
import { Dialog } from '@workspace/ui/components/dialog'
import { InterceptedDialogContent } from '@workspace/ui/components/intercepted-dialog-content'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug, teamId } = await params

  const isPersonalAccount = organizationSlug === 'my-account' && teamId === '~'

  const member = await getMembership({ organizationSlug })

  const isAdmin = isPersonalAccount || member?.isAdmin

  if (!isAdmin) {
    return null
  }

  return (
    <Dialog defaultOpen>
      <InterceptedDialogContent>
        <p className="text-sm">Create an agent</p>
      </InterceptedDialogContent>
    </Dialog>
  )
}
