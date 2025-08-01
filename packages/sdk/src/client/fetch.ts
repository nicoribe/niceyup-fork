import { baseFetch } from '../lib/base-fetch'
import type { RequestConfig } from '../lib/config'

export type { RequestConfig, ResponseErrorConfig } from '../lib/config'

export type ResponseConfig<TData = unknown, TError = unknown> =
  | {
      data: TData
      error: null
    }
  | {
      data: null
      error: TError
    }

export async function clientFetch<
  TData,
  TError = unknown,
  TVariables = unknown,
>(
  paramsConfig: RequestConfig<TVariables>,
): Promise<ResponseConfig<TData, TError>> {
  const response = await baseFetch(paramsConfig)

  const data =
    [204, 205, 304].includes(response.status) || !response.body
      ? null
      : await response.json()

  if (response.ok) {
    return { error: null, data } as ResponseConfig<TData, TError>
  }

  return { error: data, data: null } as ResponseConfig<TData, TError>
}

export default clientFetch
