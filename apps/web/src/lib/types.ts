export type OrganizationTeamParams = {
  organizationSlug: 'my-account' | '$id'
  teamId: '~' | '$id'
}

export type ChatParams = {
  chatId: 'new' | '$id'
}

export type Agent = any

export type Chat = {
  id: string
  title: string
  agentId: string | null
}
