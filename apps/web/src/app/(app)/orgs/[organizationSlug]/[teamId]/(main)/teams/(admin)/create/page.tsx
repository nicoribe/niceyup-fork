import { getOrganizationIdBySlug } from '@/actions/organizations'
import type { OrganizationTeamParams } from '@/lib/types'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Users2Icon } from 'lucide-react'
import { CreateTeamForm } from './_components/create-team-form'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug } = await params

  const organizationId = await getOrganizationIdBySlug({ organizationSlug })

  if (!organizationId) {
    return null
  }

  return (
    <div className="w-full max-w-xl p-4 md:p-10">
      <Card>
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border">
            <Users2Icon className="size-6 text-muted-foreground" />
          </div>

          <CardTitle className="text-center font-semibold text-xl leading-none">
            Create a Team
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-5">
          <CreateTeamForm
            organizationSlug={organizationSlug}
            organizationId={organizationId}
          />
        </CardContent>
      </Card>
    </div>
  )
}
