import { OrganizationSwitcher } from '@/components/organization/organization-switcher'
import { ProfileButton } from '@/components/organization/profile-button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { authenticatedUser } from '@/lib/auth/server'
import { type Organization, type Team, auth } from '@workspace/auth'
import { Separator } from '@workspace/ui/components/separator'
import { Slash } from 'lucide-react'
import { headers } from 'next/headers'
import Link from 'next/link'

export async function Header({
  selectedOrganizationLabel,
}: {
  selectedOrganizationLabel?: string
}) {
  const {
    session: { activeOrganizationId, activeTeamId },
    user: personalAccount,
  } = await authenticatedUser()

  const organizations = await auth.api.listOrganizations({
    headers: await headers(),
  })

  let activeOrganization: Organization | undefined
  if (!selectedOrganizationLabel) {
    activeOrganization = organizations.find(
      ({ id }) => id === activeOrganizationId,
    )
  }

  let teams: Team[] = []
  if (activeOrganizationId) {
    teams = await auth.api.listOrganizationTeams({
      headers: await headers(),
    })
  }

  const activeTeam = teams.find(({ id }) => id === activeTeamId)

  return (
    <header className="z-50 flex flex-col items-center justify-center bg-background">
      <div className="no-scrollbar flex w-full items-center justify-between gap-4 overflow-scroll px-4 py-2">
        <div className="flex items-center gap-1">
          <div className="px-2">
            <Link href="/">
              <div className="size-8 rounded-full bg-border" />
            </Link>
          </div>

          <Slash className="-rotate-[24deg] size-3 text-border" />

          <OrganizationSwitcher
            selectedOrganizationLabel={selectedOrganizationLabel}
            personalAccount={personalAccount}
            activeOrganization={activeOrganization}
            organizations={organizations}
            activeTeam={activeTeam}
            teams={teams}
          />
        </div>

        <div className="flex items-center gap-1">
          <ThemeSwitcher />

          <Separator
            orientation="vertical"
            className="data-[orientation=vertical]:h-4"
          />

          <ProfileButton />
        </div>
      </div>

      <Separator />
    </header>
  )
}
