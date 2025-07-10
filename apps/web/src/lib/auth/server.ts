import { auth } from '@workspace/auth'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export async function getSessionToken() {
  return (await cookies()).get('auth.session_token')?.value
}

export async function isAuthenticated() {
  return !!(await getSessionToken())
}

export const getCurrentUser = cache(async () => {
  try {
    const data = await auth.api.getSession({ headers: await headers() })

    if (data?.user) {
      return data.user
    }

    throw new Error('Uauthorized')
  } catch {
    redirect('/auth/sign-out')
  }
})
