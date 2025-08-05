import {
  type CookiesFn,
  deleteCookie as deleteCookieNext,
  getCookie as getCookieNext,
  setCookie as setCookieNext,
} from 'cookies-next'

async function getCookieStore(): Promise<CookiesFn | undefined> {
  if (typeof window === 'undefined') {
    const { cookies: serverCookies } = await import('next/headers')

    return serverCookies
  }
}

export async function setCookie(key: string, data: any): Promise<void> {
  const cookieStore = await getCookieStore()

  setCookieNext(key, data, { cookies: cookieStore })
}

export async function getCookie(key: string): Promise<string | undefined> {
  const cookieStore = await getCookieStore()

  return await getCookieNext(key, { cookies: cookieStore })
}

export async function deleteCookie(key: string): Promise<void> {
  const cookieStore = await getCookieStore()

  deleteCookieNext(key, { cookies: cookieStore })
}
