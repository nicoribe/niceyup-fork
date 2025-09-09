'use client'

import {
  createFolderInConversationExplorerTree,
  getChildrenWithDataInConversationExplorerTree,
  getItemInConversationExplorerTree,
  updateNameOfItemInConversationExplorerTree,
  updateParentIdOfItemsInConversationExplorerTree,
} from '@/actions/conversation-explorer-tree'
import { revalidateTag } from '@/actions/revalidate'
import type {
  ChatParams,
  ConversationExplorerType,
  OrganizationTeamParams,
} from '@/lib/types'
import {
  asyncDataLoaderFeature,
  dragAndDropFeature,
  hotkeysCoreFeature,
  keyboardDragAndDropFeature,
  renamingFeature,
  selectionFeature,
} from '@headless-tree/core'
import { AssistiveTreeDescription, useTree } from '@headless-tree/react'
import { Tree, TreeDragLine } from '@workspace/ui/components/tree'
import { cn } from '@workspace/ui/lib/utils'
import {
  ChevronDown,
  FolderPlus,
  Loader2,
  MessageCirclePlus,
  RotateCw,
} from 'lucide-react'
import { redirect, useParams } from 'next/navigation'
import * as React from 'react'
import { create } from 'zustand'
import { useOpenChats } from '../[chatId]/_components/open-chats'
import { TreeItemData } from './tree-item-data'

interface Folder {
  id: string
  name: string
  parentId?: string
  loading?: boolean
  disabled?: boolean
}

interface ItemPath {
  parentIds?: string[]
  id: string
}

interface ExplorerTreeStore {
  selectedExplorerType: ConversationExplorerType

  selectedFolder: Folder[]
  setSelectedFolder: ({
    explorerType,
    selectedFolder,
  }: {
    explorerType: ConversationExplorerType
    selectedFolder: Folder[]
  }) => void

  revealItemInExplorer: ItemPath | null
  setRevealItemInExplorer: ({
    explorerType,
    revealItemInExplorer,
  }: {
    explorerType: ConversationExplorerType
    revealItemInExplorer: ItemPath | null
  }) => void
}

export const useExplorerTree = create<ExplorerTreeStore>((set) => ({
  selectedExplorerType: 'private',

  selectedFolder: [],
  setSelectedFolder: ({ explorerType, selectedFolder }) =>
    set({ selectedExplorerType: explorerType, selectedFolder }),

  revealItemInExplorer: null,
  setRevealItemInExplorer: ({ explorerType, revealItemInExplorer }) =>
    set({ selectedExplorerType: explorerType, revealItemInExplorer }),
}))

export interface Item {
  name: string
  conversationId?: string | null
  children?: string[]
  loading?: boolean
  disabled?: boolean
}

const indent = 5

type Params = OrganizationTeamParams & { agentId: string } & ChatParams

export function ExplorerTree({
  explorerType,
  expanded: defaultExpanded = false,
}: { explorerType: ConversationExplorerType; expanded?: boolean }) {
  const { teamId } = useParams<Params>()

  const [expanded, setExpanded] = React.useState(defaultExpanded)

  const refExplorerTreeContent = React.useRef<RefExplorerTreeContent>(null)

  const onToggleExpanded = () => {
    setExpanded(!expanded)
  }

  const onNewChat = (e: React.MouseEvent) => {
    e.stopPropagation()

    setExpanded(true)
    refExplorerTreeContent.current?.onNewChat()
  }

  const onNewFolder = (e: React.MouseEvent) => {
    e.stopPropagation()

    setExpanded(true)
    refExplorerTreeContent.current?.onNewFolder()
  }

  const onRefresh = (e: React.MouseEvent) => {
    e.stopPropagation()

    setExpanded(true)
    console.log('Refresh')
  }

  const noTeamSelected = explorerType === 'team' && teamId === '~'

  return (
    <div
      className={cn(
        'group/explorer-tree not-first:mt-2 flex flex-col items-stretch gap-2 overflow-hidden',
        !noTeamSelected && expanded && 'flex-1',
      )}
    >
      <div className="px-2">
        <div
          className="flex h-6 w-full select-none flex-row items-center justify-between text-nowrap rounded-md px-2 py-1 font-semibold text-muted-foreground text-xs uppercase tracking-wide hover:bg-accent"
          onClick={onToggleExpanded}
        >
          <div className="flex flex-row items-center gap-2">
            <ChevronDown className={cn('size-4', !expanded && '-rotate-90')} />
            {explorerType}
          </div>

          {!noTeamSelected && (
            <div className="flex flex-row items-center opacity-0 transition-opacity group-hover/explorer-tree:opacity-100">
              {explorerType !== 'shared' && (
                <div
                  onClick={onNewChat}
                  className="group/explorer-tree-button px-1"
                >
                  <MessageCirclePlus className="size-3.5 shrink-0 text-muted-foreground group-hover/explorer-tree-button:text-foreground" />
                </div>
              )}
              <div
                onClick={onNewFolder}
                className="group/explorer-tree-button px-1"
              >
                <FolderPlus className="size-3.5 shrink-0 text-muted-foreground group-hover/explorer-tree-button:text-foreground" />
              </div>
              <div
                onClick={onRefresh}
                className="group/explorer-tree-button px-1"
              >
                <RotateCw className="size-3.5 shrink-0 text-muted-foreground group-hover/explorer-tree-button:text-foreground" />
              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn('flex-1 overflow-y-auto px-2', !expanded && 'max-h-0')}
      >
        {noTeamSelected ? (
          <div className="flex h-full items-center justify-center gap-2 p-2 text-muted-foreground">
            <h1 className="mb-2 p-2 text-center text-xs">
              Select a team to view its conversations
            </h1>
          </div>
        ) : (
          <ExplorerTreeContent
            ref={refExplorerTreeContent}
            explorerType={explorerType}
          />
        )}
      </div>
    </div>
  )
}

type RefExplorerTreeContent = {
  onNewChat: () => void
  onNewFolder: () => void
}

function ExplorerTreeContent({
  ref,
  explorerType,
}: {
  explorerType: ConversationExplorerType
  ref?: React.RefObject<RefExplorerTreeContent | null>
}) {
  const { organizationSlug, teamId, agentId, chatId } = useParams<Params>()

  const {
    selectedExplorerType,
    setSelectedFolder,
    revealItemInExplorer,
    setRevealItemInExplorer,
  } = useExplorerTree()

  const { setOpenChats } = useOpenChats()

  const [loadingExplorerTree, setLoadingExplorerTree] = React.useState(true)

  const [revealingItemInExplorer, setRevealingItemInExplorer] =
    React.useState(false)

  const tree = useTree<Item>({
    indent,
    rootItemId: 'root',
    getItemName: (item) => item.getItemData().name || '(untitled)',
    isItemFolder: (item) =>
      !item.getItemData().conversationId && !item.getItemData().loading,
    createLoadingItemData: () => ({ name: '(loading)', loading: true }),
    dataLoader: {
      getItem: async (itemId) => {
        const itemData = await getItemInConversationExplorerTree(
          { organizationSlug, teamId, agentId },
          { explorerType, itemId },
        )

        setLoadingExplorerTree(false)

        return itemData || { name: '(unknown)', disabled: true }
      },
      getChildrenWithData: async (itemId) => {
        const childrenWithData =
          await getChildrenWithDataInConversationExplorerTree(
            { organizationSlug, teamId, agentId },
            { explorerType, itemId },
          )

        setLoadingExplorerTree(false)

        return childrenWithData
      },
    },
    canReorder: true,
    onDrop: async (items, target) => {
      await updateParentIdOfItemsInConversationExplorerTree(
        { organizationSlug, teamId, agentId },
        {
          explorerType,
          itemIds: items.map((item) => item.getId()),
          parentId: target.item.getId(),
        },
      )

      const invalidatedParentIds = new Set<string>()

      for (const item of items) {
        const parentItemInstance = item.getParent()
        if (parentItemInstance) {
          invalidatedParentIds.add(parentItemInstance.getId())
        }
      }

      for (const parentId of invalidatedParentIds) {
        const parentItemInstance = tree.getItemInstance(parentId)
        if (parentItemInstance) {
          await parentItemInstance.invalidateChildrenIds()
        }
      }

      await Promise.all([
        target.item.invalidateChildrenIds(),
        revalidateTag(`chat-${chatId}`),
      ])
    },
    onRename: async (item, value) => {
      const itemChatId = item.getItemData().conversationId

      await updateNameOfItemInConversationExplorerTree(
        { organizationSlug, teamId, agentId },
        {
          explorerType,
          name: value,
          ...(itemChatId
            ? { conversationId: itemChatId }
            : { itemId: item.getId() }),
        },
      )

      if (itemChatId) {
        setOpenChats(agentId, (prevChats) => {
          const chat = prevChats.find(({ id }) => id === itemChatId)
          if (chat) {
            chat.title = value
          }
          return prevChats
        })
      }

      await Promise.all([
        item.invalidateItemData(),
        chatId === itemChatId && revalidateTag(`chat-${chatId}`),
      ])
    },
    features: [
      asyncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      dragAndDropFeature,
      keyboardDragAndDropFeature,
      renamingFeature,
    ],
  })

  React.useImperativeHandle(ref, () => ({
    onNewChat: async () => {
      getPathSelectedFolderInExplorer()

      redirect(
        `/orgs/${organizationSlug}/${teamId}/agents/${agentId}/chats/new`,
      )
    },
    onNewFolder: async () => {
      const selectedItemId = tree.getState().selectedItems.at(-1)

      let selectedItemInstance = selectedItemId
        ? tree.getItemInstance(selectedItemId)
        : undefined

      if (selectedItemInstance && !selectedItemInstance.isFolder()) {
        selectedItemInstance = selectedItemInstance.getParent()
      }

      if (selectedItemInstance) {
        selectedItemInstance.expand()
      } else {
        selectedItemInstance = tree.getRootItem()
      }

      const newFolder = await createFolderInConversationExplorerTree(
        { organizationSlug, teamId, agentId },
        {
          explorerType,
          parentId: selectedItemInstance.getId(),
          name: '(new folder)',
        },
      )

      if (newFolder) {
        await selectedItemInstance.invalidateChildrenIds()

        setTimeout(() => {
          const newFolderItemInstance = selectedItemInstance
            .getChildren()
            .find((child) => child.getId() === newFolder.id)

          if (newFolderItemInstance) {
            tree.setSelectedItems([newFolderItemInstance.getId()])
            newFolderItemInstance.startRenaming()
          }
        }, 300)
      }
    },
  }))

  const getPathSelectedFolderInExplorer = () => {
    try {
      if (
        // Not necessary to get the path of a shared explorer (used in the new chat breadcrumb)
        explorerType === 'shared' ||
        // Prevent actions while items or child elements are still loading
        tree.getState().loadingItemData.length ||
        tree.getState().loadingItemChildrens.length
      ) {
        return
      }

      if (!tree.getSelectedItems().length) {
        setSelectedFolder({ explorerType, selectedFolder: [] })
        return
      }

      const selectedItemId = tree.getState().selectedItems.at(-1)

      if (!selectedItemId) {
        return
      }

      const selectedItemInstance = tree.getItemInstance(selectedItemId)
      const selectedFolder = []

      let currentItem = selectedItemInstance

      while (currentItem) {
        if (currentItem.isFolder()) {
          selectedFolder.push({
            id: currentItem.getId(),
            name: currentItem.getItemData().name,
            parentId: currentItem.getParent()?.getId(),
            loading: currentItem.getItemData().loading,
            disabled: currentItem.getItemData().disabled,
          })
        }

        const parent = currentItem.getParent()
        if (!parent || parent.getId() === 'root') {
          break
        }
        currentItem = parent
      }

      setSelectedFolder({
        explorerType,
        selectedFolder: selectedFolder.reverse(),
      })
    } catch {}
  }

  const setRevealSelectedItemInExplorer = async () => {
    try {
      if (revealItemInExplorer && !revealingItemInExplorer) {
        setRevealingItemInExplorer(true)

        if (revealItemInExplorer.parentIds?.length) {
          const invalidatedParentIds = []

          for (const parentId of revealItemInExplorer.parentIds.reverse()) {
            if (parentId) {
              const parentItemInstance = tree.getItemInstance(parentId)
              invalidatedParentIds.push(parentId)

              if (parentItemInstance) {
                break
              }
            }
          }

          for (const parentId of invalidatedParentIds.reverse()) {
            const parentItemInstance = tree.getItemInstance(parentId)
            if (parentItemInstance) {
              await parentItemInstance.invalidateChildrenIds()
              parentItemInstance.expand()
            }
          }
        } else {
          const rootItemInstance = tree.getRootItem()
          await rootItemInstance.invalidateChildrenIds()
        }

        const selectedItemInstance = tree.getItemInstance(
          revealItemInExplorer.id,
        )
        if (selectedItemInstance) {
          tree.setSelectedItems([revealItemInExplorer.id])
          selectedItemInstance.setFocused()
        }
      }
    } catch {
    } finally {
      setRevealingItemInExplorer(false)
      setRevealItemInExplorer({
        explorerType: explorerType === 'shared' ? 'private' : explorerType,
        revealItemInExplorer: null,
      })
    }
  }

  React.useEffect(() => {
    getPathSelectedFolderInExplorer()
  }, [
    tree.getState().selectedItems,
    tree.getState().loadingItemData,
    tree.getState().loadingItemChildrens,
  ])

  React.useEffect(() => {
    if (selectedExplorerType === explorerType) {
      setRevealSelectedItemInExplorer()
    }
  }, [revealItemInExplorer])

  return (
    <Tree indent={indent} tree={tree} className="h-full">
      <AssistiveTreeDescription tree={tree} />
      {tree.getItems().map((item) => {
        return (
          <TreeItemData
            key={item.getId()}
            explorerType={explorerType}
            tree={tree}
            item={item}
          />
        )
      })}

      {loadingExplorerTree && (
        <div className="flex h-full items-center justify-center gap-2 p-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          <h1 className="p-2 text-xs">Loading</h1>
        </div>
      )}
      {!loadingExplorerTree && !tree.getItems().length && (
        <div className="flex h-full items-center justify-center gap-2 p-2 text-muted-foreground">
          <h1 className="p-2 text-xs">Empty</h1>
        </div>
      )}
      <TreeDragLine />
    </Tree>
  )
}
