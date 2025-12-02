'use client'

import type { OrganizationTeamParams } from '@/lib/types'
import {
  type FeatureImplementation,
  type ItemInstance,
  type TreeInstance,
  asyncDataLoaderFeature,
  checkboxesFeature,
  expandAllFeature,
  hotkeysCoreFeature,
  selectionFeature,
} from '@headless-tree/core'
import { useTree } from '@headless-tree/react'
import { Checkbox } from '@workspace/ui/components/checkbox'
import { Spinner } from '@workspace/ui/components/spinner'
import { Tree, TreeItem, TreeItemLabel } from '@workspace/ui/components/tree'
import { cn } from '@workspace/ui/lib/utils'
import { CircleX, FileIcon, FolderIcon, FolderOpenIcon } from 'lucide-react'
import * as React from 'react'
import {
  getChildrenWithDataInSourceExplorerNode,
  getItemInSourceExplorerNode,
} from '../_actions/source-explorer-nodes'

// ============================================================================
// Provider Context & Types
// ============================================================================

type Params = OrganizationTeamParams & { agentId: string }

type Item = {
  name?: string
  sourceId?: string | null
  fractionalIndex?: string | null
  folder?: boolean
  loading?: boolean
  disabled?: boolean
  unknown?: boolean
  children?: string[]
}

function toItemData(item: Item) {
  const folder = !item.sourceId
  return { ...item, folder, children: folder ? item.children : undefined }
}

declare module '@headless-tree/core' {
  // biome-ignore lint/correctness/noUnusedVariables: <explanation>
  export interface ItemInstance<T> {
    isSource: () => boolean
  }
}

const sourceExplorerFeature: FeatureImplementation<Item> = {
  key: 'source-explorer',
  itemInstance: {
    isSource: ({ item }) => item.getItemData().sourceId,
  },
}

type SourceExplorerContextType = {
  params: Params
  indent: number
  tree: TreeInstance<Item>
}

const SourceExplorerContext = React.createContext<
  SourceExplorerContextType | undefined
>(undefined)

export function useSourceExplorerContext(): SourceExplorerContextType {
  const context = React.useContext(SourceExplorerContext)

  if (context === undefined) {
    throw new Error(
      'useSourceExplorerContext must be used within a SourceExplorerProvider',
    )
  }

  return context
}

export function SourceExplorerProvider({
  params,
  initialItems,
  initialCheckedItems,
  onCheckedItems,
  children,
}: {
  params: Params
  initialItems?: { id: string; data: Item }[]
  initialCheckedItems?: string[]
  onCheckedItems?: (itemIds: string[]) => void
  children: React.ReactNode
}) {
  const indent = 10

  const [checkedItems, setCheckedItems] = React.useState<string[]>(
    initialCheckedItems || [],
  )

  const tree = useTree<Item>({
    indent,
    rootItemId: 'root',
    state: {
      checkedItems,
    },
    setCheckedItems,
    getItemName: (item) => item.getItemData().name || '',
    isItemFolder: (item) => Boolean(item.getItemData().folder),
    createLoadingItemData: () => ({
      id: 'loading',
      loading: true,
      disabled: true,
    }),
    dataLoader: {
      getItem: async (itemId) => {
        const itemData = await getItemInSourceExplorerNode(params, {
          itemId,
        })

        if (itemData) {
          return toItemData(itemData)
        }

        return { id: 'unknown', unknown: true, disabled: true }
      },
      getChildrenWithData: async (itemId) => {
        const hasInitialItems = itemId === 'root' && initialItems?.length

        const childrenWithData = hasInitialItems
          ? initialItems
          : await getChildrenWithDataInSourceExplorerNode(params, {
              itemId,
            })

        return childrenWithData.map((child) => ({
          ...child,
          data: toItemData(child.data),
        }))
      },
    },
    onLoadedItem: async (itemId, item) => {
      if (item.folder) {
        await tree.loadChildrenIds(itemId)
      }
    },
    features: [
      asyncDataLoaderFeature,
      selectionFeature,
      hotkeysCoreFeature,
      checkboxesFeature,
      expandAllFeature,
      sourceExplorerFeature,
    ],
  })

  React.useEffect(() => {
    onCheckedItems?.([...new Set(checkedItems)])
  }, [checkedItems])

  const contextValue: SourceExplorerContextType = { params, indent, tree }

  return (
    <SourceExplorerContext.Provider value={contextValue}>
      {children}
    </SourceExplorerContext.Provider>
  )
}

type SourceExplorerItemContextType = {
  item: ItemInstance<Item>
}

const SourceExplorerItemContext = React.createContext<
  SourceExplorerItemContextType | undefined
>(undefined)

export function useSourceExplorerItemContext(): SourceExplorerItemContextType {
  const context = React.useContext(SourceExplorerItemContext)

  if (context === undefined) {
    throw new Error(
      'useSourceExplorerItemContext must be used within a SourceExplorerItemProvider',
    )
  }

  return context
}

export function SourceExplorerItemProvider({
  item,
  children,
}: {
  item: ItemInstance<Item>
  children: React.ReactNode
}) {
  const contextValue: SourceExplorerItemContextType = { item }

  return (
    <SourceExplorerItemContext.Provider value={contextValue}>
      {children}
    </SourceExplorerItemContext.Provider>
  )
}

// ============================================================================
// Components
// ============================================================================

export function SourceExplorer() {
  const { indent, tree } = useSourceExplorerContext()

  return (
    <Tree indent={indent} tree={tree}>
      {tree.getItems().map((item) => (
        <SourceExplorerTreeItem key={item.getId()} item={item} />
      ))}
    </Tree>
  )
}

function SourceExplorerTreeItem({ item }: { item: ItemInstance<Item> }) {
  const checkedState = {
    checked: true,
    indeterminate: 'indeterminate' as const,
    unchecked: false,
  }[item.getCheckedState()]

  return (
    <SourceExplorerItemProvider item={item}>
      <div
        className="flex items-center gap-1.5 not-last:pb-0.5"
        key={item.getId()}
      >
        <Checkbox
          checked={checkedState}
          onCheckedChange={(checked) => {
            const checkboxProps = item.getCheckboxProps()
            checkboxProps.onChange?.({ target: { checked } })
          }}
          disabled={item.getItemData().disabled}
        />
        <TreeItem
          className="flex-1 not-last:pb-0"
          item={item}
          data-disabled={item.getItemData().disabled}
          asChild
        >
          <div>
            <SourceExplorerItem />
          </div>
        </TreeItem>
      </div>
    </SourceExplorerItemProvider>
  )
}

function SourceExplorerItem() {
  const { item } = useSourceExplorerItemContext()

  if (item.getItemData().unknown) {
    return (
      <TreeItemLabel>
        <span className="flex items-center gap-2">
          <CircleX className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground italic">Unknown</p>
        </span>
      </TreeItemLabel>
    )
  }

  if (item.getItemData().loading) {
    return (
      <TreeItemLabel>
        <span className="flex items-center gap-2">
          <Spinner className="size-4 text-muted-foreground" />
          <p className="text-muted-foreground italic">Loading</p>
        </span>
      </TreeItemLabel>
    )
  }

  return (
    <TreeItemLabel>
      <SourceExplorerItemLabel />
    </TreeItemLabel>
  )
}

function SourceExplorerItemLabel() {
  const { item } = useSourceExplorerItemContext()

  return (
    <span className="flex flex-1 items-center gap-2">
      {item.isLoading() ? (
        <Spinner className="size-4 text-muted-foreground" />
      ) : item.isFolder() ? (
        item.isExpanded() ? (
          <FolderOpenIcon className="size-4 text-muted-foreground" />
        ) : (
          <FolderIcon className="size-4 text-muted-foreground" />
        )
      ) : (
        <FileIcon className="size-4 text-muted-foreground" />
      )}

      <p className="flex items-center gap-1">
        <span
          className={cn('line-clamp-1 break-all text-start', {
            italic: !item.getItemName(),
          })}
        >
          {item.getItemName() || 'Untitled'}
        </span>
      </p>
    </span>
  )
}
