'use client'

import type { ChatParams } from '@/lib/types'
import { useAppearance } from '@/store/use-appearance'
import { cn } from '@workspace/ui/lib/utils'
import { useParams } from 'next/navigation'

export function Topbar({ children }: { children: React.ReactNode }) {
  const params = useParams<ChatParams>()

  const { topbar } = useAppearance()

  if (params.chatId) {
    return (
      <div
        className={cn('flex flex-col items-stretch justify-center', {
          hidden: !topbar,
        })}
      >
        {children}
      </div>
    )
  }

  return children
}
