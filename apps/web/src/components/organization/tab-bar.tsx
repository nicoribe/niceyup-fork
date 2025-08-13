'use client'

import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export type TabItem = {
  label: React.ReactNode | string
  href: string
  deep?: boolean
}

export function TabBar({ tabs }: { tabs?: TabItem[] }) {
  if (!tabs?.length) {
    return null
  }

  const pathname = usePathname()

  return (
    <div className="-mt-1.5 sticky top-0 z-50 flex flex-col items-stretch bg-background">
      <div className="no-scrollbar flex flex-row items-center overflow-scroll px-6">
        {tabs.map((tab, index) => (
          <div
            key={`${tab.href}-${index}`}
            data-state={
              (tab.deep ? pathname.includes(tab.href) : pathname === tab.href)
                ? 'active'
                : 'inactive'
            }
            className="cursor-pointer p-1 data-[state=active]:border-primary data-[state=active]:border-b-2"
          >
            <Button variant="ghost" size="sm" className="px-3" asChild>
              <Link href={tab.href}>{tab.label}</Link>
            </Button>
          </div>
        ))}
      </div>

      <Separator />
    </div>
  )
}
