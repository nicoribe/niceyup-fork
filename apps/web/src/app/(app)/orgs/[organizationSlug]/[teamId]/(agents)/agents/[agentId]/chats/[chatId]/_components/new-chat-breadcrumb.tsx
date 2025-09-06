'use client'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { Slash } from 'lucide-react'
import * as React from 'react'
import { useExplorerTree } from '../../_components/explorer-tree'

export function NewChatBreadcrumb() {
  const { selectedFolder } = useExplorerTree()

  return (
    <Breadcrumb>
      <BreadcrumbList className="flex-nowrap text-xs sm:gap-1">
        <BreadcrumbSeparator className="[&>svg]:size-3">
          <Slash className="-rotate-[24deg] text-border" />
        </BreadcrumbSeparator>

        {selectedFolder.map((item, index) => {
          if (item.disabled) {
            return null
          }

          return (
            <React.Fragment key={`${item.id}-${index}`}>
              <BreadcrumbItem className="text-nowrap">
                {item.loading ? (
                  <Skeleton className="h-4 w-15 rounded-sm" />
                ) : (
                  <BreadcrumbPage>{item.name}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator
                key={`${item.id}-${index}-separator`}
                className="[&>svg]:size-3"
              >
                <Slash className="-rotate-[24deg] text-border" />
              </BreadcrumbSeparator>
            </React.Fragment>
          )
        })}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
