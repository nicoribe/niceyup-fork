import { Header } from '@/components/organizations/header'
import { getSessionToken } from '@/lib/auth/session-token'
import { Button } from '@workspace/ui/components/button'
import Link from 'next/link'

export default async function NotFound() {
  const authenticated = await getSessionToken()

  if (authenticated) {
    return (
      <div className="flex min-h-svh flex-col items-stretch justify-center bg-foreground/3">
        <Header selectedOrganizationLabel="Not found" />

        <main className="flex flex-1 flex-col items-center justify-center gap-4">
          <div className="flex flex-col items-center justify-center space-y-4">
            <h1 className="font-bold text-xl">404 - Page Not Found</h1>
            <span className="text-muted-foreground text-sm">
              Oops! The page you are looking for does not exist.
            </span>

            <Button asChild>
              <Link href="/">Back to Home</Link>
            </Button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center space-y-4">
      <h1 className="font-bold text-xl">404 - Page Not Found</h1>
      <span className="text-muted-foreground text-sm">
        Oops! The page you are looking for does not exist.
      </span>

      <Button asChild>
        <Link href="/">Back to Home</Link>
      </Button>
    </div>
  )
}
