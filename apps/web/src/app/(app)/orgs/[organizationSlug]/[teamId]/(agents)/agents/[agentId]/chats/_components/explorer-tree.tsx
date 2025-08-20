'use client'

import {
  getChildrenWithDataInConversationExplorerTree,
  getItemInConversationExplorerTree,
  updateNameOfItemInConversationExplorerTree,
  updateParentIdOfItemsInConversationExplorerTree,
} from '@/actions/conversation-explorer-tree'
import { revalidateTag } from '@/actions/revalidate'
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
  parentIds: string[]
  id: string
}

interface ExplorerTreeStore {
  selectedFolder: Folder[]
  setSelectedFolder: (selectedFolder: Folder[]) => void

  revealItemInExplorer: ItemPath | null
  setRevealItemInExplorer: (revealItemInExplorer: ItemPath | null) => void
}

export const useExplorerTree = create<ExplorerTreeStore>((set) => ({
  selectedFolder: [],
  setSelectedFolder: (selectedFolder) => set({ selectedFolder }),

  revealItemInExplorer: null,
  setRevealItemInExplorer: (revealItemInExplorer) =>
    set({ revealItemInExplorer }),
}))

export interface Item {
  name: string
  conversationId?: string | null
  children?: string[]
  loading?: boolean
  disabled?: boolean
}

const indent = 5

export function ExplorerTree() {
  const { setSelectedFolder, revealItemInExplorer, setRevealItemInExplorer } =
    useExplorerTree()

  const [revealingItemInExplorer, setRevealingItemInExplorer] =
    React.useState(false)

  const { setOpenChats } = useOpenChats()

  const tree = useTree<Item>({
    indent,
    rootItemId: 'root',
    getItemName: (item) => item.getItemData().name || '(untitled)',
    isItemFolder: (item) => !item.getItemData().conversationId,
    createLoadingItemData: () => ({ name: '(loading)', loading: true }),
    dataLoader: {
      getItem: async (itemId) => {
        const itemData = await getItemInConversationExplorerTree({
          explorerType: 'private',
          itemId,
        })

        return itemData || { name: '(unknown)', disabled: true }
      },
      getChildrenWithData: async (itemId) => {
        const childrenWithData =
          await getChildrenWithDataInConversationExplorerTree({
            explorerType: 'private',
            itemId,
          })

        return childrenWithData
      },
    },
    canReorder: true,
    onDrop: async (items, target) => {
      await updateParentIdOfItemsInConversationExplorerTree({
        explorerType: 'private',
        itemIds: items.map((item) => item.getId()),
        parentId: target.item.getId(),
      })

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
        revalidateTag('chats-explorer-tree'),
      ])
    },
    onRename: async (item, value) => {
      await updateNameOfItemInConversationExplorerTree({
        explorerType: 'private',
        itemId: item.getId(),
        name: value,
      })

      await Promise.all([
        item.invalidateItemData(),
        revalidateTag('chats-explorer-tree'),
      ])

      const chatId = item.getItemData().conversationId
      if (chatId) {
        setOpenChats((prevChats) => {
          const chat = prevChats.find(({ id }) => id === chatId)
          if (chat) {
            chat.title = item.getItemData().name
          }
          return prevChats
        })
      }
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

  const reloadSelectedFolder = () => {
    try {
      if (!tree.getSelectedItems().length) {
        setSelectedFolder([])
        return
      }

      if (
        tree.getState().loadingItemData.length ||
        tree.getState().loadingItemChildrens.length
      ) {
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

      setSelectedFolder(selectedFolder.reverse())
    } catch {}
  }

  const setSelectedItem = async () => {
    try {
      if (revealItemInExplorer && !revealingItemInExplorer) {
        setRevealingItemInExplorer(true)

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
      setRevealItemInExplorer(null)
    }
  }

  React.useEffect(() => {
    reloadSelectedFolder()
  }, [
    tree.getState().selectedItems,
    tree.getState().loadingItemData,
    tree.getState().loadingItemChildrens,
  ])

  React.useEffect(() => {
    setSelectedItem()
  }, [revealItemInExplorer])

  return (
    <Tree indent={indent} tree={tree} className="h-full">
      <AssistiveTreeDescription tree={tree} />
      {tree.getItems().map((item) => {
        return <TreeItemData key={item.getId()} item={item} tree={tree} />
      })}
      <TreeDragLine />
    </Tree>
  )
}
