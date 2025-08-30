'use client'

import type { PromptInputStatus } from '@/lib/types'
import {
  PromptInput,
  PromptInputButton,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@workspace/ui/components/prompt-input'
import { GlobeIcon, MicIcon, PlusIcon } from 'lucide-react'
import * as React from 'react'

export function SendMessage({
  status,
  sendMessage,
}: {
  status: PromptInputStatus
  sendMessage: (message: string) => Promise<void>
}) {
  const [text, setText] = React.useState<string>('')

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault()

    if (!text.trim()) {
      return
    }

    await sendMessage(text)
  }

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        onChange={(e) => setText(e.target.value)}
        value={text}
      />

      <PromptInputToolbar>
        <PromptInputTools>
          <PromptInputButton>
            <PlusIcon size={16} />
          </PromptInputButton>

          <PromptInputButton>
            <MicIcon size={16} />
          </PromptInputButton>

          <PromptInputButton>
            <GlobeIcon size={16} />
            <span>Search</span>
          </PromptInputButton>
        </PromptInputTools>

        <PromptInputSubmit disabled={!text.trim()} status={status} />
      </PromptInputToolbar>
    </PromptInput>
  )
}
