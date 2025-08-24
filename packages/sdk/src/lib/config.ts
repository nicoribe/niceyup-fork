export type RequestConfig<TData = unknown> = {
  baseURL?: string
  url?: string
  method?: 'GET' | 'PUT' | 'PATCH' | 'POST' | 'DELETE'
  params?: object
  data?: TData | FormData
  responseType?:
    | 'arraybuffer'
    | 'blob'
    | 'document'
    | 'json'
    | 'text'
    | 'stream'
  signal?: AbortSignal
  headers?: HeadersInit | (() => Promise<HeadersInit | undefined>)
  credentials?: 'omit' | 'same-origin' | 'include'
  next?: {
    revalidate?: number | false | undefined
    tags?: string[] | undefined
  }
}

export type ResponseConfig<TData = unknown> = {
  data: TData
  status: number
  statusText: string
  headers: Headers
}

export type ResponseErrorConfig<TError = unknown> = TError

let _config: Partial<RequestConfig> = {}

export const getConfig = () => _config

export const setConfig = (config: Partial<RequestConfig>) => {
  _config = config
  return getConfig()
}
