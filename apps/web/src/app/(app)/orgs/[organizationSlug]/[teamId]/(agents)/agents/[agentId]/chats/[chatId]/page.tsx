import { getConversation } from '@/actions/conversations'
import type { ChatParams } from '@/lib/types'
import { Breadcrumb, BreadcrumbList } from '@workspace/ui/components/breadcrumb'
import { Separator } from '@workspace/ui/components/separator'
import { cn } from '@workspace/ui/lib/utils'
import { Appearance } from '../_components/appearance'
import { NewChatBreadcrumb } from './_components/new-chat-breadcrumb'
import { OpenChats } from './_components/open-chats'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ agentId: string } & ChatParams>
}>) {
  const { agentId, chatId } = await params

  const chat = await getConversation(agentId, chatId)

  return (
    <div className="flex h-full flex-col">
      <OpenChats />

      <Separator />

      <div className="flex flex-row items-center bg-background px-1">
        <div className="no-scrollbar flex flex-1 flex-row items-center gap-1 overflow-x-scroll py-1">
          <div className="flex flex-row items-center gap-1 px-2">
            {chat ? (
              <Breadcrumb>
                <BreadcrumbList className="flex-nowrap text-xs sm:gap-1">
                  {/* {chat.pathInExplorer.map((item, index) => (
                    <>
                      <BreadcrumbItem
                        key={`${item.id}-${index}`}
                        className="text-nowrap"
                      >
                        <BreadcrumbPage>{item.name}</BreadcrumbPage>
                      </BreadcrumbItem>
                      {index !== chat.pathInExplorer.length - 1 && (
                        <BreadcrumbSeparator className="[&>svg]:size-3">
                          <Slash className="-rotate-[24deg] text-border" />
                        </BreadcrumbSeparator>
                      )}
                    </>
                  ))} */}
                </BreadcrumbList>
              </Breadcrumb>
            ) : chatId === 'new' ? (
              <NewChatBreadcrumb />
            ) : null}
          </div>
        </div>

        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-full"
        />

        <Appearance />
      </div>

      <Separator />

      <div
        className={cn(
          'flex h-full flex-col items-center overflow-auto p-2',
          chat ? 'justify-start' : 'justify-center',
        )}
      >
        {chat ? (
          <h1 className="text-sm">Chat: {chat.title}</h1>
        ) : chatId === 'new' ? (
          <h1 className="text-sm">New Chat</h1>
        ) : (
          <h1 className="text-sm">Chat Not Found</h1>
        )}
      </div>
    </div>
  )
}
