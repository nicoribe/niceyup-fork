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

export const activeMember = cache(async () => {
  try {
    const member = await auth.api.getActiveMember({
      headers: await headers(),
    })

    if (!member) {
      throw new Error('No active member')
    }

    return member
  } catch {
    // redirect('/orgs/my-account/~/overview')
  }
})

export const listOrganizations = cache(async () => {
  try {
    const organizations = await auth.api.listOrganizations({
      headers: await headers(),
    })

    return organizations
  } catch {
    return []
  }
})

export const listOrganizationTeams = cache(async () => {
  try {
    const teams = await auth.api.listOrganizationTeams({
      headers: await headers(),
    })

    return teams
  } catch {
    return []
  }
})
