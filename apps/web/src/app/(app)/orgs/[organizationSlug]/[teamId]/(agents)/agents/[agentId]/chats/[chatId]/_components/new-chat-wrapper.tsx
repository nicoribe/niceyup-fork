import type { ChatParams, OrganizationTeamParams } from '@/lib/types'
import { NewChat } from './new-chat'

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export async function NewChatWrapper({ params }: { params: Params }) {
  // TODO: Make this dynamic based on the agent's configuration
  const suggestions = [
    'What are the latest trends in AI?',
    'How does machine learning work?',
    'Explain quantum computing',
    'Best practices for React development',
    'Tell me about TypeScript benefits',
    'How to optimize database queries?',
    'What is the difference between SQL and NoSQL?',
    'Explain cloud computing basics',
  ]

  return <NewChat params={params} suggestions={suggestions} />
}
