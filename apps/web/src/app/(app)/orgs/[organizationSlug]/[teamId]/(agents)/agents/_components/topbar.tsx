'use client'

import type { ChatParams } from '@/lib/types'
import { useAppearance } from '@/store/use-appearance'
import { cn } from '@workspace/ui/lib/utils'
import { useParams } from 'next/navigation'

export function Topbar({ children }: { children: React.ReactNode }) {
  const params = useParams<ChatParams>()

  const { topbar } = useAppearance()

  return (
    <div
      className={cn(
        'flex transform flex-col items-stretch justify-center',
        params.chatId && {
          '-translate-y-full max-h-0 opacity-0': !topbar,
          'max-h-96 translate-y-0 opacity-100': topbar,
        },
      )}
    >
      {children}
    </div>
  )
}
