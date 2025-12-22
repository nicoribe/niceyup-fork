import { SignOutLink } from '@/components/auth/sign-out-link'
import { Logo } from '@/components/logo'
import { ProfileButton } from '@/components/profile-button'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { authenticatedUser } from '@/lib/auth/server'
import { getInitials } from '@/lib/utils'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar'
import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import Link from 'next/link'

export default async function Page() {
  const { user } = await authenticatedUser()

  return (
    <div className="flex min-h-svh flex-col items-stretch justify-center bg-background">
      <header className="z-50 flex flex-col items-center justify-center bg-background">
        <div className="no-scrollbar flex w-full items-center justify-between gap-4 overflow-auto px-4 py-2">
          <div className="flex items-center gap-1">
            <div className="px-2">
              <Link href="/">
                <Logo className="size-8" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <ThemeSwitcher />

            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />

            <ProfileButton />
          </div>
        </div>

        <Separator />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <div className="flex w-full max-w-xs flex-col items-center gap-6">
          <Avatar className="size-12">
            {user.image && <AvatarImage src={user.image} />}
            <AvatarFallback className="text-xs">
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex flex-col items-center gap-4">
            <h2 className="text-center font-bold text-xl">Access Required</h2>

            <p className="text-center text-foreground text-sm leading-relaxed">
              You are signed in as <strong>{user.name}</strong>.
            </p>
          </div>

          <Button asChild>
            <Link href="https://niceyup.com/request-access">
              Request Access
            </Link>
          </Button>

          <SignOutLink className="text-primary text-sm hover:underline">
            Sign in with a different Niceyup Account
          </SignOutLink>
        </div>
      </main>
    </div>
  )
}
