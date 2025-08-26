export function getOrganizationIdentifier({
  organizationId,
  organizationSlug,
  teamId,
}: {
  organizationId?: string
  organizationSlug?: string
  teamId?: string
}) {
  const organizationIdentifier =
    organizationSlug && organizationSlug !== 'my-account'
      ? { organizationSlug }
      : { organizationId }

  return {
    ...organizationIdentifier,
    teamId: teamId !== '~' ? teamId : undefined,
  }
}
