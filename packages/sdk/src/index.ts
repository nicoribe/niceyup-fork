import { setConfig } from './lib/config'

import * as operations from './api/generated/operations'
import * as hooks from './api/generated/react-query/hooks'
import * as schemas from './api/generated/schemas'
import * as types from './api/generated/types'

type ClientOptions = {
  baseURL?: string
  getSessionTokenFn?: () => Promise<string | null>
}

export function createClient(options: ClientOptions) {
  setConfig({
    baseURL: options.baseURL,
    getSessionTokenFn: options.getSessionTokenFn,
  })

  return {
    ...operations,
    $reactQuery: hooks,
    $schemas: schemas,
    $types: types,
  }
}
