import { Logo } from '@/components/logo'
import { OrganizationSwitcher } from '@/components/organizations/organization-switcher'
import { ProfileButton } from '@/components/organizations/profile-button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import {
  authenticatedUser,
  listOrganizationTeams,
  listOrganizations,
} from '@/lib/auth/server'
import { sdk } from '@/lib/sdk'
import type { Agent } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { Slash } from 'lucide-react'
import Link from 'next/link'
import { AgentSwitcher } from './agent-switcher'

type Organization = Awaited<ReturnType<typeof listOrganizations>>[number]
type Team = Awaited<ReturnType<typeof listOrganizationTeams>>[number]

export async function Header({
  selectedOrganizationLabel,
  activeAgent,
}: {
  selectedOrganizationLabel?: string
  activeAgent?: Agent
}) {
  // TODO: Implement suspense for the header

  const {
    session: { activeOrganizationId, activeTeamId },
    user: personalAccount,
  } = await authenticatedUser()

  const organizations = await listOrganizations()

  let activeOrganization: Organization | undefined
  if (!selectedOrganizationLabel) {
    activeOrganization = organizations.find(
      ({ id }) => id === activeOrganizationId,
    )
  }

  let teams: Team[] = []
  if (activeOrganizationId) {
    teams = await listOrganizationTeams()
  }

  const activeTeam = teams.find(({ id }) => id === activeTeamId)

  let agents: Agent[] = []
  if (activeTeamId) {
    agents = (await sdk.listAgents()).data?.agents || []
  }

  return (
    <header className="z-50 flex flex-col items-center justify-center bg-background">
      <div className="no-scrollbar flex w-full items-center justify-between gap-4 overflow-scroll px-4 py-2">
        <div className="flex items-center gap-1">
          <div className="px-2">
            <Link href="/">
              <Logo className="size-8" />
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

          {!!activeAgent && (
            <>
              <Slash className="-rotate-[24deg] size-3 text-border" />

              <AgentSwitcher
                organizationSlug={activeOrganization?.slug}
                teamId={activeTeam?.id}
                activeAgent={activeAgent}
                agents={agents}
              />
            </>
          )}
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
