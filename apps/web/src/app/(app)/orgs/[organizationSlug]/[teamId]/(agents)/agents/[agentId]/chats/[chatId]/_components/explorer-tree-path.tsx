'use client'

import type { ChatParams } from '@/lib/types'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb'
import { Slash } from 'lucide-react'
import { useParams } from 'next/navigation'
import type { PathInExplorer } from '../../_lib/types'
import { NewChatBreadcrumb } from './new-chat-breadcrumb'

export function ExplorerTreePath({
  pathInExplorer,
}: {
  pathInExplorer: PathInExplorer[]
}) {
  const { chatId } = useParams<ChatParams>()

  return (
    <div className="flex flex-row items-center gap-1 px-2">
      {chatId === 'new' ? (
        <NewChatBreadcrumb />
      ) : (
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap text-xs sm:gap-1">
            <BreadcrumbSeparator className="[&>svg]:size-3">
              <Slash className="-rotate-[24deg] text-border" />
            </BreadcrumbSeparator>

            {pathInExplorer.map((item, index) => (
              <>
                <BreadcrumbItem
                  key={`${item.id}-${index}`}
                  className="text-nowrap"
                >
                  <BreadcrumbPage>{item.name}</BreadcrumbPage>
                </BreadcrumbItem>
                {index !== pathInExplorer.length - 1 && (
                  <BreadcrumbSeparator className="[&>svg]:size-3">
                    <Slash className="-rotate-[24deg] text-border" />
                  </BreadcrumbSeparator>
                )}
              </>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </div>
  )
}
