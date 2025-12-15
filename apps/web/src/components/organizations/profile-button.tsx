import { SignOutLink } from '@/components/auth/sign-out-link'
import { authenticatedUser } from '@/lib/auth/server'
import { getInitials } from '@/lib/utils'
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
import { Book, ChevronDown, LogOut, MessageSquareMore } from 'lucide-react'
import Link from 'next/link'

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
          <ChevronDown className="size-4 text-muted-foreground" />
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
            <Link href="/">Dashboard</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/account/settings">Account settings</Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <Link href="/docs" target="_blank">
              Documentation
              <Book className="ml-auto size-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/support" target="_blank">
              Support
              <MessageSquareMore className="ml-auto size-4" />
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem asChild>
            <SignOutLink>
              Sign out
              <LogOut className="ml-auto size-4" />
            </SignOutLink>
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
