import { cookies } from 'next/headers'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const redirectUrl = request.nextUrl.clone()

  redirectUrl.pathname = '/auth/sign-in'

  const cookieStore = await cookies()

  cookieStore.delete('auth.session_token')

  return NextResponse.redirect(redirectUrl)
}
