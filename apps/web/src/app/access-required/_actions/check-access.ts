'use server'

import { authenticatedUser } from '@/lib/auth/server'
import { env } from '@/lib/env'
import { redirect } from 'next/navigation'

/**
 * Temporary access validation for closed beta users
 *
 * This access control is used only while Niceyup is under development
 * and in a closed beta period. After the official release, this check
 * will no longer be necessary and should be removed.
 */
export async function checkAccess() {
  if (env.APP_ENV === 'production') {
    const { user } = await authenticatedUser()

    const response = await fetch(
      `https://niceyup.com/api/check-access?email=${user.email}`,
    )

    const hasAccess = response.ok

    if (!hasAccess) {
      return redirect('/access-required')
    }
  }

  return true
}
