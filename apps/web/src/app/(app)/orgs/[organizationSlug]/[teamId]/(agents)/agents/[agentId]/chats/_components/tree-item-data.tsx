'use client'

import {
  createFolderInConversationExplorerTree,
  deleteItemInConversationExplorerTree,
} from '@/actions/conversation-explorer-tree'
import type { OrganizationTeamParams } from '@/lib/types'
import type { ItemInstance, TreeInstance } from '@headless-tree/core'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Input } from '@workspace/ui/components/input'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { TreeItem, TreeItemLabel } from '@workspace/ui/components/tree'
import { cn } from '@workspace/ui/lib/utils'
import {
  FolderIcon,
  FolderOpenIcon,
  LoaderCircleIcon,
  MessageCircleIcon,
  MoreHorizontalIcon,
} from 'lucide-react'
import { redirect, useParams } from 'next/navigation'
import type * as React from 'react'
import type { Item } from './explorer-tree'

type Params = OrganizationTeamParams & { agentId: string }

export function TreeItemData({
  item,
  tree,
}: { item: ItemInstance<Item>; tree: TreeInstance<Item> }) {
  const { organizationSlug, teamId, agentId } = useParams<Params>()

  if (item.getItemData().disabled) {
    return null
  }

  if (item.getItemData().loading) {
    return (
      <TreeItem key={item.getId()} item={item}>
        <TreeItemLabel>
          <Skeleton className="size-5 shrink-0 rounded-full" />
          <Skeleton className="h-5 w-full rounded-sm" />
        </TreeItemLabel>
      </TreeItem>
    )
  }

  const onNewChat = async (e: React.MouseEvent) => {
    e.stopPropagation()

    tree.setSelectedItems([item.getId()])
    item.expand()

    redirect(`/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/new`)
  }
  const onNewFolder = async (e: React.MouseEvent) => {
    e.stopPropagation()

    item.expand()

    const newFolder = await createFolderInConversationExplorerTree(
      { organizationSlug, teamId, agentId },
      {
        explorerType: 'private',
        parentId: item.getId(),
        name: '(new folder)',
      },
    )

    if (newFolder) {
      await item.invalidateChildrenIds()

      setTimeout(() => {
        const newFolderItemInstance = item
          .getChildren()
          .find((child) => child.getId() === newFolder.id)

        if (newFolderItemInstance) {
          tree.setSelectedItems([newFolderItemInstance.getId()])
          newFolderItemInstance.startRenaming()
        }
      }, 300)
    }
  }

  const onRename = (e: React.MouseEvent) => {
    e.stopPropagation()

    // Fix: The renaming input is not focused
    setTimeout(() => item.startRenaming(), 300)
  }

  const onDelete = async (e: React.MouseEvent) => {
    e.stopPropagation()

    await deleteItemInConversationExplorerTree(
      { organizationSlug, teamId, agentId },
      {
        explorerType: 'private',
        itemId: item.getId(),
      },
    )

    const parentItemInstance = item.getParent()

    if (parentItemInstance) {
      tree.setSelectedItems([parentItemInstance.getId()])
      await parentItemInstance.invalidateChildrenIds()
    } else {
      await item.invalidateItemData()
    }
  }

  return (
    <TreeItem key={item.getId()} item={item}>
      <TreeItemLabel
        onClick={(e) => {
          if (
            !e.shiftKey &&
            !e.ctrlKey &&
            !e.metaKey &&
            item.getItemData().conversationId
          ) {
            redirect(
              `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/${item.getItemData().conversationId}`,
            )
          }
        }}
      >
        <div className="flex items-center gap-2">
          {item.isFolder() ? (
            item.isExpanded() ? (
              <FolderOpenIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
            ) : (
              <FolderIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
            )
          ) : (
            <MessageCircleIcon className="pointer-events-none size-4 shrink-0 text-muted-foreground" />
          )}
          {item.isRenaming() ? (
            <Input
              {...item.getRenameInputProps()}
              autoFocus
              className="-my-0.5 h-6 px-1"
            />
          ) : (
            <span className="line-clamp-1 break-all text-start">
              {item.getItemName()}
            </span>
          )}
        </div>

        {item.isLoading() ? (
          <LoaderCircleIcon className="size-4 animate-spin text-muted-foreground" />
        ) : (
          item.isFolder() && (
            <span className="text-muted-foreground">
              {`(${item.getItemData().children?.length || 0})`}
            </span>
          )
        )}

        <DropdownMenu>
          <DropdownMenuTrigger className="ml-auto" asChild>
            <div>
              <MoreHorizontalIcon
                className={cn(
                  'size-4 text-muted-foreground group-hover:text-foreground',
                  {
                    'hidden group-hover:block': !item.isSelected(),
                  },
                )}
              />
            </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {item.isFolder() && (
              <>
                <DropdownMenuItem onClick={onNewChat}>
                  New Chat
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onNewFolder}>
                  New Folder
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}

            <DropdownMenuItem onClick={onRename}>
              Rename
              <DropdownMenuShortcut>F2</DropdownMenuShortcut>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TreeItemLabel>
    </TreeItem>
  )
}
