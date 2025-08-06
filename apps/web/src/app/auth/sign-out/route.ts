import { deleteSessionToken } from '@/lib/auth/session-token'
import { auth } from '@workspace/auth'
import { headers } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/auth/sign-in'

  try {
    // Delete session token from database
    await auth.api.signOut({
      headers: await headers(),
    })
  } catch {
  } finally {
    // Delete session token from cookies
    await deleteSessionToken()
  }

  return NextResponse.redirect(redirectUrl)
}
