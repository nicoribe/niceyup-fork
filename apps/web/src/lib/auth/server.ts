import { auth } from '@workspace/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

export const authenticatedUser = cache(async () => {
  try {
    const authSession = await auth.api.getSession({
      headers: await headers(),
    })

    if (!authSession) {
      throw new Error('Unauthorized')
    }

    return authSession
  } catch {
    redirect('/auth/sign-out')
  }
})
