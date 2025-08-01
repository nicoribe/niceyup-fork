import { auth } from '@workspace/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { getSessionToken } from './session-token'

export async function isAuthenticated() {
  return !!(await getSessionToken())
}

export const authenticatedUser = cache(async () => {
  try {
    const session = await auth.api.getSession({ headers: await headers() })

    if (!session) {
      throw new Error('Unauthorized')
    }

    return session
  } catch {
    redirect('/auth/sign-out')
  }
})
