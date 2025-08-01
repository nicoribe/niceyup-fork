import { type RequestConfig, getConfig } from './config'

export function targetUrl<TVariables>(
  config: RequestConfig<TVariables>,
): string {
  const normalizedParams = new URLSearchParams()

  for (const [key, value] of Object.entries(config.params || {})) {
    if (value !== undefined) {
      normalizedParams.append(key, value === null ? 'null' : value.toString())
    }
  }

  let targetUrl = [config.baseURL, config.url].filter(Boolean).join('')

  if (config.params) {
    targetUrl += `?${normalizedParams}`
  }

  return targetUrl
}

export async function getHeaders(headers?: HeadersInit) {
  const sessionToken = await getConfig().getSessionTokenFn?.()
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    ...(sessionToken ? { Authorization: `Bearer ${sessionToken}` } : {}),
    ...(headers || {}),
  }
}
