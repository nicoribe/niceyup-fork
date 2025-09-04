'use client'

import { ChatPromptInput, ChatProvider } from '@/components/chat'
import { Suggestion, Suggestions } from '@workspace/ui/components/suggestion'
import * as React from 'react'

export function NewChat({ suggestions }: { suggestions: string[] }) {
  const [suggestion, setSuggestion] = React.useState<string>('')

  const handleSuggestionClick = (suggestion: string) => {
    setSuggestion(suggestion)
  }

  return (
    <div className="flex h-full flex-col items-center justify-center bg-background">
      <div className="flex w-full max-w-2xl flex-col gap-4 p-2">
        <Suggestions>
          {suggestions.map((suggestion) => (
            <Suggestion
              key={suggestion}
              suggestion={suggestion}
              onClick={handleSuggestionClick}
            />
          ))}
        </Suggestions>

        <ChatProvider>
          <ChatPromptInput suggestion={suggestion} />
        </ChatProvider>
      </div>
    </div>
  )
}
