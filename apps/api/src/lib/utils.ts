export function getOrganizationIdentifier({
  organizationId,
  organizationSlug,
  teamId,
}: {
  organizationId?: string | null
  organizationSlug?: string | null
  teamId?: string | null
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
