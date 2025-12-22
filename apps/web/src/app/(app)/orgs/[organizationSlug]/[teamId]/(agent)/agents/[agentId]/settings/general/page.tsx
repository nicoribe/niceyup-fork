import type { AgentParams } from '@/lib/types'
import { ViewAgentId } from './_components/view-agent-id'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<AgentParams>
}>) {
  const { agentId } = await params

  return (
    <div className="flex w-full flex-col gap-4">
      <ViewAgentId id={agentId} />
    </div>
  )
}
