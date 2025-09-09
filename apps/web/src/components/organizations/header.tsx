import {
  listOrganizationTeams,
  listOrganizations,
} from '@/actions/organizations'
import { Logo } from '@/components/logo'
import { OrganizationSwitcher } from '@/components/organizations/organization-switcher'
import { ProfileButton } from '@/components/organizations/profile-button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { authenticatedUser } from '@/lib/auth/server'
import { sdk } from '@/lib/sdk'
import type { Agent, Team } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { Slash } from 'lucide-react'
import Link from 'next/link'
import { AgentSwitcher } from './agent-switcher'

export async function Header({
  selectedOrganizationLabel,
  organizationSlug,
  teamId,
  activeAgent,
}: {
  selectedOrganizationLabel?: string
  organizationSlug?: string
  teamId?: string
  activeAgent?: Agent
}) {
  const {
    session: { activeOrganizationId, activeTeamId },
    user: personalAccount,
  } = await authenticatedUser()

  const organizations = await listOrganizations()

  const activeOrganization = organizations.find(
    ({ slug }) => slug === organizationSlug,
  )

  let teams: Team[] = []
  let activeTeam: Team | undefined

  if (activeOrganization) {
    teams = await listOrganizationTeams({
      organizationId: activeOrganization.id,
    })

    const currentTeamId =
      (!teamId || teamId === '~') &&
      activeOrganizationId === activeOrganization.id
        ? activeTeamId
        : teamId

    activeTeam = teams.find(({ id }) => id === currentTeamId)
  }

  let agents: Agent[] = []

  if (activeAgent) {
    const { data } = await sdk.listAgents({
      params: {
        organizationId: activeOrganization?.id,
        teamId: activeTeam?.id,
      },
    })

    if (data?.agents) {
      agents = data.agents
    }
  }

  return (
    <header className="z-50 flex flex-col items-center justify-center bg-background">
      <div className="no-scrollbar flex w-full items-center justify-between gap-4 overflow-auto px-4 py-2">
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

          {activeAgent && (
            <>
              <Slash className="-rotate-[24deg] size-3 text-border" />

              <AgentSwitcher activeAgent={activeAgent} agents={agents} />
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
