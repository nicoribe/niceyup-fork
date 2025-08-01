import { deleteSessionToken } from '@/lib/auth/session-token'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone()
  redirectUrl.pathname = '/auth/sign-in'

  await deleteSessionToken()

  return NextResponse.redirect(redirectUrl)
}
