'use client'

import { Suggestion, Suggestions } from '@workspace/ui/components/suggestion'
import { useChat } from '../_hooks/use-chat'
import { SendMessage } from './send-message'

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

export function NewChat() {
  const { status, sendMessage } = useChat({ chatId: 'new' })

  const handleSuggestionClick = async (suggestion: string) => {
    await sendMessage(suggestion)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background">
      <div className="flex w-full max-w-2xl flex-col gap-4 p-2">
        <Suggestions>
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={handleSuggestionClick}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>

        <SendMessage status={status} sendMessage={sendMessage} />
      </div>
    </div>
  )
}
