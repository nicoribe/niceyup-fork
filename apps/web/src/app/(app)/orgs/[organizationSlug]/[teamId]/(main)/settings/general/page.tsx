import { getOrganization } from '@/actions/organizations'
import type { OrganizationTeamParams } from '@/lib/types'
import { ViewOrganizationId } from './_components/view-organization-id'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<OrganizationTeamParams>
}>) {
  const { organizationSlug } = await params

  // const member = await getMembership({ organizationSlug })

  // const isAdmin = member?.isAdmin

  const organization = await getOrganization({ organizationSlug })

  return (
    <div className="flex w-full flex-col gap-4">
      {/* {organization && (
        <>
          <EditOrganizationNameForm
            params={{ organizationSlug }}
            name={organization.name}
            isAdmin={isAdmin}
          />

          <EditOrganizationSlugForm
            params={{ organizationSlug }}
            slug={organization.slug}
            isAdmin={isAdmin}
          />

          <EditOrganizationLogoForm
            params={{ organizationSlug }}
            logo={organization.logo}
            isAdmin={isAdmin}
          />
        </>
      )} */}

      {organization && <ViewOrganizationId id={organization.id} />}

      {/* {organization && (
        <DeleteOrganizationForm
          params={{
            organizationSlug,
            organizationId: organization.organizationId,
          }}
        />
      )} */}
    </div>
  )
}
