export type OrganizationTeamParams = {
  organizationSlug: 'my-account' | '$id'
  teamId: '~' | '$id'
}

export type ChatParams = {
  chatId: 'new' | '$id'
}

export type Organization = {
  id: string
  slug: string
  name: string
  logo?: string | null | undefined
  metadata?: any
}

export type Team = {
  id: string
  name: string
  organizationId: string
}

export type Agent = {
  id: string
  name: string
}

export type Chat = {
  id: string
  title: string
  agentId: string | null
}
