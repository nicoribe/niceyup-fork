import { baseFetch } from '../lib/base-fetch'
import type { RequestConfig, ResponseConfig } from '../lib/config'

export type {
  RequestConfig,
  ResponseConfig,
  ResponseErrorConfig,
} from '../lib/config'

export async function clientFetchReactQuery<
  TData,
  TError = unknown,
  TVariables = unknown,
>(paramsConfig: RequestConfig<TVariables>): Promise<ResponseConfig<TData>> {
  const response = await baseFetch(paramsConfig)

  const data =
    [204, 205, 304].includes(response.status) || !response.body
      ? null
      : await response.json()

  if (!response.ok) {
    return Promise.reject(data as TError)
  }

  return {
    data: data as TData,
    status: response.status,
    statusText: response.statusText,
    headers: response.headers as Headers,
  }
}

export default clientFetchReactQuery
