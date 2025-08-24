import { deleteCookie, getCookie } from '@/lib/headers'
import { COOKIE_SESSION_TOKEN_NAME } from '@workspace/auth/constants'

export async function getSessionToken() {
  const sessionToken = await getCookie(COOKIE_SESSION_TOKEN_NAME)

  return sessionToken || null
}

export async function deleteSessionToken() {
  await deleteCookie(COOKIE_SESSION_TOKEN_NAME)
}
