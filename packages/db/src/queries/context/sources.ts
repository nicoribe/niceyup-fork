type ContextGetSourceParams = {
  userId: string
} & (
  | {
      organizationId?: string | null
      organizationSlug?: never
    }
  | {
      organizationId?: never
      organizationSlug?: string | null
    }
) & {
    teamId?: string | null
  }

type GetSourceParams = {
  sourceId: string
}

export async function getSource(
  context: ContextGetSourceParams,
  params: GetSourceParams,
) {
  throw new Error('Not implemented')

  return null
}
