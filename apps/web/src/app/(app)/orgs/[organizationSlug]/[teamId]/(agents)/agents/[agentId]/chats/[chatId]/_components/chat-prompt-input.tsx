'use client'

import type { PromptInputStatus, PromptMessagePart } from '@/lib/types'
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

export function ChatPromptInput({
  suggestion,
  status,
  sendMessage,
}: {
  suggestion?: string
  status: PromptInputStatus
  sendMessage: ({ parts }: { parts: PromptMessagePart[] }) => Promise<void>
}) {
  const [text, setText] = React.useState<string>('')

  React.useEffect(() => {
    if (suggestion) {
      setText(suggestion)
    }
  }, [suggestion])

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = async (
    event,
  ) => {
    event.preventDefault()

    if (!text.trim() || status === 'submitted' || status === 'streaming') {
      return
    }

    setText('')

    await sendMessage({
      parts: [
        {
          type: 'text',
          text: 'Descreva detalhadamente o conteúdo da imagem!',
        },
        {
          type: 'file',
          mediaType: 'image/jpeg',
          filename: 'two-puppies.jpeg',
          url: 'https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg',
        },
      ],
      // parts: [{ type: 'text', text }],
    })
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

        <PromptInputSubmit
          status={status}
          disabled={!text.trim() && (status === 'ready' || status === 'error')}
        />
      </PromptInputToolbar>
    </PromptInput>
  )
}
