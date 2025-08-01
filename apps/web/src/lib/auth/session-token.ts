import { COOKIE_SESSION_TOKEN_NAME } from '@workspace/auth/constants'
import { type CookiesFn, deleteCookie, getCookie } from 'cookies-next'

export async function getSessionToken() {
  let cookieStore: CookiesFn | undefined

  if (typeof window === 'undefined') {
    const { cookies: serverCookies } = await import('next/headers')

    cookieStore = serverCookies
  }

  const sessionToken = await getCookie(COOKIE_SESSION_TOKEN_NAME, {
    cookies: cookieStore,
  })

  return sessionToken || null
}

export async function deleteSessionToken() {
  let cookieStore: CookiesFn | undefined

  if (typeof window === 'undefined') {
    const { cookies: serverCookies } = await import('next/headers')

    cookieStore = serverCookies
  }

  deleteCookie(COOKIE_SESSION_TOKEN_NAME, {
    cookies: cookieStore,
  })
}
