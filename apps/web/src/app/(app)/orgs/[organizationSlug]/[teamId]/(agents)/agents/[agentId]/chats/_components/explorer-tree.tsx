'use client'

import {
  getChildrenWithDataInConversationExplorerTree,
  getItemInConversationExplorerTree,
  updateNameOfItemInConversationExplorerTree,
  updateParentIdOfItemsInConversationExplorerTree,
} from '@/actions/conversation-explorer-tree'
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
import { TreeItemData } from './tree-item-data'

export interface Item {
  name: string
  conversationId?: string | null
  children?: string[]
  disabled?: boolean
}

const indent = 10

export function ExplorerTree() {
  const [selectedItem] = React.useState<{
    parentIds: string[]
    id: string
  } | null>(null)

  const tree = useTree<Item>({
    indent,
    rootItemId: 'root',
    getItemName: (item) => item.getItemData().name || '(untitled)',
    isItemFolder: (item) => !item.getItemData().conversationId,
    createLoadingItemData: () => ({ name: '(loading)', disabled: true }),
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

      await target.item.invalidateChildrenIds()
    },
    onRename: async (item, value) => {
      await updateNameOfItemInConversationExplorerTree({
        explorerType: 'private',
        itemId: item.getId(),
        name: value,
      })

      await item.invalidateItemData()
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

  const [seletingItem, setSelectingItem] = React.useState(false)

  const setSelectedItem = async ({
    parentIds,
    id,
  }: {
    parentIds: string[]
    id: string
  }) => {
    if (!seletingItem) {
      setSelectingItem(true)

      const invalidatedParentIds = []

      for (const parentId of parentIds.reverse()) {
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

      const selectedItemInstance = tree.getItemInstance(id)
      if (selectedItemInstance) {
        tree.setSelectedItems([id])
        selectedItemInstance.setFocused()
      }

      setSelectingItem(false)
    }
  }

  React.useEffect(() => {
    if (selectedItem) {
      setSelectedItem(selectedItem)
    }
  }, [selectedItem])

  return (
    <Tree indent={indent} tree={tree} className="h-full">
      <AssistiveTreeDescription tree={tree} />
      {tree.getItems().map((item) => {
        return <TreeItemData key={item.getId()} item={item} />
      })}
      <TreeDragLine />
    </Tree>
  )
}
