'use client'

import type { OrganizationTeamParams } from '@/lib/types'
import * as React from 'react'
import { SourceExplorer, SourceExplorerProvider } from './source-explorer'

type Params = OrganizationTeamParams & { agentId: string }

export function SelectSource({ params }: { params: Params }) {
  const [checkedItems, setCheckedItems] = React.useState<string[]>([])

  const onCheckedItems = (itemIds: string[]) => {
    setCheckedItems(itemIds)
  }

  return (
    <SourceExplorerProvider
      params={params}
      initialCheckedItems={checkedItems}
      onCheckedItems={onCheckedItems}
    >
      <SourceExplorer />
    </SourceExplorerProvider>
  )
}
