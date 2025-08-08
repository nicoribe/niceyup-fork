import { getSessionToken } from '@/lib/auth/session-token'
import { type NextRequest, NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const response = NextResponse.next()

  if (pathname === '/auth/sign-out') {
    return response
  }

  const authenticated = Boolean(await getSessionToken())
  const authRoutes = pathname.startsWith('/auth/')

  if (authenticated && authRoutes) {
    return NextResponse.redirect(new URL('/', request.nextUrl))
  }

  if (!authenticated && !authRoutes) {
    const redirectUrl = pathname === '/' ? '' : `redirectUrl=${pathname}`

    return NextResponse.redirect(
      new URL(`/auth/?${redirectUrl}`, request.nextUrl),
    )
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt (metadata files)
     */
    '/((?!api(?:/|$)|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
}
