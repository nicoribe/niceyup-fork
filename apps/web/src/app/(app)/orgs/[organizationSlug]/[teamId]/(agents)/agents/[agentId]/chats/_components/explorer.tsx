'use client'

import {
  createOnDropHandler,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  renamingFeature,
  selectionFeature,
  syncDataLoaderFeature,
} from '@headless-tree/core'
import { AssistiveTreeDescription, useTree } from '@headless-tree/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { Input } from '@workspace/ui/components/input'
import {
  Tree,
  TreeDragLine,
  TreeItem,
  TreeItemLabel,
} from '@workspace/ui/components/tree'
import { cn } from '@workspace/ui/lib/utils'
import {
  FolderIcon,
  FolderOpenIcon,
  MessageCircleIcon,
  MoreVerticalIcon,
} from 'lucide-react'
import * as React from 'react'

interface Item {
  name?: string
  children?: string[]
  // TODO: chatId?: string
}

const initialItems: Record<string, Item> = {
  root: {
    name: 'Root',
    children: ['ae025337-2404-4752-b00d-62a288388b36'],
  },
  'ae025337-2404-4752-b00d-62a288388b36': {
    name: 'My Chats',
    children: ['5940ed05-741e-4772-8719-52edecfbd81b'],
  },
  '5940ed05-741e-4772-8719-52edecfbd81b': {
    name: '(untitled)',
  },
}

const indent = 10

export function Explorer() {
  const [items, setItems] = React.useState(initialItems)

  const tree = useTree<Item>({
    initialState: {
      // TODO: Expand and select the selected chat
    },
    indent,
    rootItemId: 'root',
    getItemName: (item) => item.getItemData().name || '(untitled)',
    isItemFolder: (item) => Array.isArray(item.getItemData().children),
    canReorder: true,
    onDrop: createOnDropHandler((parentItem, newChildrenIds) => {
      // Update the item children in our state
      const itemId = parentItem.getId()
      setItems((prevItems) => ({
        ...prevItems,
        [itemId]: {
          ...prevItems[itemId],
          children: newChildrenIds,
        },
      }))
    }),
    dataLoader: {
      getItem: (itemId) => items[itemId]!,
      getChildren: (itemId) => items[itemId]!.children!,
    },
    onRename: (item, newName) => {
      // Update the item name in our state
      const itemId = item.getId()
      setItems((prevItems) => ({
        ...prevItems,
        [itemId]: {
          ...prevItems[itemId],
          name: newName,
        },
      }))
    },
    features: [
      syncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
      renamingFeature,
    ],
  })

  return (
    <Tree indent={indent} tree={tree} className="h-full">
      <AssistiveTreeDescription tree={tree} />
      {tree.getItems().map((item) => {
        const onRename = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          e.stopPropagation()

          // Fix: The renaming input is not focused
          setTimeout(() => {
            item.startRenaming()
          }, 250)
        }

        const onDelete = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
          e.stopPropagation()
        }

        return (
          <TreeItem key={item.getId()} item={item}>
            <TreeItemLabel className="link">
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
                    {item.isFolder() && (
                      <span className="ml-1 text-muted-foreground">
                        {`(${item.getChildren().length})`}
                      </span>
                    )}
                  </span>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger className="ml-auto">
                  <MoreVerticalIcon
                    className={cn(
                      'size-4 text-muted-foreground hover:text-foreground',
                      {
                        'hidden group-hover:block': !item.isSelected(),
                      },
                    )}
                  />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
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
      })}
      <TreeDragLine />
    </Tree>
  )
}
