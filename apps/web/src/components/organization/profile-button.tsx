import { SignOutLink } from '@/components/auth/sign-out-link'
import { authenticatedUser } from '@/lib/auth/server'
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '@workspace/ui/components/avatar'
import { Button } from '@workspace/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { ChevronDown, LogOut, User } from 'lucide-react'
import Link from 'next/link'

function getInitials(name: string): string {
  const initials = name
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('')

  return initials
}

export async function ProfileButton() {
  const { user } = await authenticatedUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Avatar className="size-8">
            {user.image && <AvatarImage src={user.image} />}
            {user.name && (
              <AvatarFallback className="text-xs">
                {getInitials(user.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <ChevronDown className="ml-auto size-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={12} className="w-[200px]">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate font-medium text-foreground text-sm">
            {user.name}
          </span>
          <span className="truncate font-normal text-muted-foreground text-xs">
            {user.email}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href="/account/profile">
              <User className="mr-1 size-4" />
              Profile
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <SignOutLink>
              <LogOut className="mr-1 size-4" />
              Sign Out
            </SignOutLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
