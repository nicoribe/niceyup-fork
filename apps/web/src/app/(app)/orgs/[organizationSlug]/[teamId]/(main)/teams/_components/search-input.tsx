'use client'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { Spinner } from '@workspace/ui/components/spinner'
import { useDebouncedCallback } from '@workspace/ui/hooks/use-debounced-callback'
import { SearchIcon } from 'lucide-react'
import { useQueryStates } from 'nuqs'
import * as React from 'react'
import { searchParams } from '../_lib/searchParams'

const DEBOUNCE_MS = 300
const THROTTLE_MS = 50

export function SearchInput() {
  const [isLoading, startTransition] = React.useTransition()
  const [{ search: searchValue }, setSearchParams] = useQueryStates(
    searchParams,
    {
      startTransition,
      clearOnDefault: true,
      shallow: false,
      throttleMs: THROTTLE_MS,
    },
  )

  const [search, setSearch] = React.useState(searchValue)

  const debouncedSetSearchParams = useDebouncedCallback(
    setSearchParams,
    DEBOUNCE_MS,
  )

  function handleSearchChange(value: string) {
    setSearch(value)
    debouncedSetSearchParams({ search: value })
  }

  return (
    <InputGroup className="h-11 bg-background">
      <InputGroupAddon>
        <SearchIcon />
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        value={search}
        onChange={(event) => handleSearchChange(event.target.value)}
        placeholder="Search for a team..."
        className="[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none"
      />

      {isLoading && (
        <InputGroupAddon align="inline-end">
          <Spinner />
        </InputGroupAddon>
      )}
    </InputGroup>
  )
}
