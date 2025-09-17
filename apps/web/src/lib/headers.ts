import {
  type CookiesFn,
  deleteCookie as deleteCookieNext,
  getCookie as getCookieNext,
  setCookie as setCookieNext,
} from 'cookies-next'

export async function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }

  if (typeof window === 'undefined') {
    const { headers: serverHeaders } = await import('next/headers')

    const headersCookies = (await serverHeaders()).get('cookie')

    return { ...headers, Cookie: headersCookies }
  }

  return headers
}

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

  await deleteCookieNext(key, { cookies: cookieStore })
}
