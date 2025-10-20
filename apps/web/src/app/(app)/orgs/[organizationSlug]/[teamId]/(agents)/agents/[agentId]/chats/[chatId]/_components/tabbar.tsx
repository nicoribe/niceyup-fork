import type { Chat, ChatParams } from '@/lib/types'
import { Separator } from '@workspace/ui/components/separator'
import { Appearance } from '../../_components/appearance'

type Params = ChatParams

export async function Tabbar({
  params,
  chat,
}: {
  params: Params
  chat: Chat | null
}) {
  return (
    <div className="flex flex-row items-center bg-background">
      <div className="no-scrollbar flex flex-1 flex-row items-center gap-1 overflow-x-auto px-2 py-1">
        <span className="whitespace-nowrap font-medium text-sm">
          {params.chatId === 'new' ? 'New Chat' : chat?.title}
        </span>
      </div>

      <Separator
        orientation="vertical"
        className="data-[orientation=vertical]:h-full"
      />

      <Appearance />
    </div>
  )
}
