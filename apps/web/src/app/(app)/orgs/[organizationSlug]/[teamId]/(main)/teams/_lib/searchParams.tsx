import { createLoader, parseAsString } from 'nuqs/server'

export const searchParams = {
  search: parseAsString.withDefault(''),
}

export const loadSearchParams = createLoader(searchParams)
