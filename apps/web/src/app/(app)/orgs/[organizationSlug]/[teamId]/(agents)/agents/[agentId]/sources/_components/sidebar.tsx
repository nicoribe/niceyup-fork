'use client'

import { Button } from '@workspace/ui/components/button'
import { cn } from '@workspace/ui/lib/utils'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type SidebarItem = {
  label: React.ReactNode | string
  href: string
  target?: string
  icon?: React.ReactNode
  deep?: boolean
}

export function Sidebar({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname()

  return (
    <>
      {items.map((item, index) => (
        <Button
          key={`${item.href}-${index}`}
          variant="ghost"
          data-state={
            (item.deep ? pathname.includes(item.href) : pathname === item.href)
              ? 'active'
              : 'inactive'
          }
          className={cn(
            'justify-start font-normal hover:bg-foreground/5 has-[>svg]:px-4 data-[state=active]:font-semibold',
          )}
          asChild
        >
          <Link href={item.href} target={item.target}>
            {item.label}
            {item.icon}
          </Link>
        </Button>
      ))}
    </>
  )
}
