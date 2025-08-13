import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

export async function AgentNotFound({
  organizationSlug,
  teamId,
}: {
  organizationSlug: string
  teamId: string
}) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <h1 className="font-bold text-xl">404 - Agent Not Found</h1>
      <span className="text-muted-foreground text-sm">
        Oops! The agent you are looking for does not exist or you don&apos;t
        have access to it.
      </span>

      <Button asChild>
        <Link href={`/orgs/${organizationSlug}/${teamId}/agents`}>
          Back to agents
        </Link>
      </Button>
    </div>
  )
}
