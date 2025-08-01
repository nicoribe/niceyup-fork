import { SignOutLink } from '@/components/auth/sign-out-link'
import { authenticatedUser } from '@/lib/auth/server'
import { Button } from '@workspace/ui/components/button'

export default async function Page() {
  const { user } = await authenticatedUser()

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <h1 className="font-bold text-2xl">Hello, {user.name}</h1>

        <Button asChild>
          <SignOutLink>Sign Out</SignOutLink>
        </Button>
      </div>
    </div>
  )
}
