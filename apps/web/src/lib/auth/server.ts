import { auth } from '@workspace/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { cache } from 'react'

async function authSession() {
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
}

export async function authenticatedUser({
  disableCache,
}: { disableCache?: true } = {}) {
  if (disableCache) {
    // Don't cache the session, it's not needed
    return authSession()
  }

  return cache(authSession)()
}

export async function activeMember() {
  return cache(async () => {
    try {
      const member = await auth.api.getActiveMember({
        headers: await headers(),
      })

      return member
    } catch {
      return null
    }
  })()
}

export async function listOrganizations() {
  return cache(async () => {
    try {
      const organizations = await auth.api.listOrganizations({
        headers: await headers(),
      })

      return organizations
    } catch {
      return []
    }
  })()
}

export async function listOrganizationTeams() {
  return cache(async () => {
    try {
      const teams = await auth.api.listOrganizationTeams({
        headers: await headers(),
      })

      return teams
    } catch {
      return []
    }
  })()
}
