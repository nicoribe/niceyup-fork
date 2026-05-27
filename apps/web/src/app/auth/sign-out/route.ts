import { auth } from '@workspace/auth'
import { COOKIE_SESSION_TOKEN_NAME } from '@workspace/auth/constants'
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
  } catch {}

  const response = NextResponse.redirect(redirectUrl)

  response.cookies.set(COOKIE_SESSION_TOKEN_NAME, '', {
    expires: new Date(0),
    path: '/',
    domain: '.niceyup-fork-web.vercel.app',
    secure: true,
  })

  return response
}
