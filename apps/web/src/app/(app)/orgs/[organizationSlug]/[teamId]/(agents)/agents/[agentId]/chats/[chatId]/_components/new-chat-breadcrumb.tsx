'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb'
import { Slash } from 'lucide-react'

export function NewChatBreadcrumb() {
  const selectedFolderPath = [{ id: 'my-chats', title: 'My Chats' }]

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap text-xs sm:gap-1">
        {selectedFolderPath.map((item, index) => (
          <>
            <BreadcrumbItem key={`${item.id}-${index}`} className="text-nowrap">
              <BreadcrumbPage>{item.title}</BreadcrumbPage>
            </BreadcrumbItem>
            <BreadcrumbSeparator
              key={`${item.id}-${index}-separator`}
              className="[&>svg]:size-3"
            >
              <Slash className="-rotate-[24deg] text-border" />
            </BreadcrumbSeparator>
          </>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
