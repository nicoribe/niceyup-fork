'use client'

import {
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@workspace/ui/components/breadcrumb'
import { Button } from '@workspace/ui/components/button'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@workspace/ui/components/drawer'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@workspace/ui/components/dropdown-menu'
import { useIsMobile } from '@workspace/ui/hooks/use-mobile'
import Link from 'next/link'
import * as React from 'react'

type BreadcrumbResponsiveProps = {
  items: {
    label: string
    href?: string
  }[]
}

const ITEMS_TO_DISPLAY = 3

export function BreadcrumbResponsive({ items }: BreadcrumbResponsiveProps) {
  const [open, setOpen] = React.useState(false)
  const isMobile = useIsMobile()

  if (!items.length) {
    return null
  }

  if (ITEMS_TO_DISPLAY < 2) {
    throw new Error('ITEMS_TO_DISPLAY must be at least 2')
  }

  const middleItems = items.slice(1, -(ITEMS_TO_DISPLAY - 1))

  const endItems = items.slice(
    items.length < ITEMS_TO_DISPLAY ? 1 : items.length - (ITEMS_TO_DISPLAY - 1),
  )

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href={items[0]?.href ?? '/'}>{items[0]?.label}</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {items.length > 1 && <BreadcrumbSeparator />}
        {items.length > ITEMS_TO_DISPLAY ? (
          <>
            <BreadcrumbItem>
              {!isMobile ? (
                <DropdownMenu open={open} onOpenChange={setOpen}>
                  <DropdownMenuTrigger className="flex items-center gap-1">
                    <BreadcrumbEllipsis className="size-4" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {middleItems.map((item) => (
                      <DropdownMenuItem key={item.label}>
                        <Link href={item.href ? item.href : '#'}>
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Drawer open={open} onOpenChange={setOpen}>
                  <DrawerTrigger>
                    <BreadcrumbEllipsis className="size-4" />
                  </DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className="text-left">
                      <DrawerTitle>Navigate to</DrawerTitle>
                      <DrawerDescription>
                        Select a page to navigate to
                      </DrawerDescription>
                    </DrawerHeader>
                    <div className="grid gap-1 px-4">
                      {middleItems.map((item) => (
                        <Link
                          key={item.label}
                          href={item.href ? item.href : '#'}
                          className="py-1 text-xs"
                        >
                          {item.label}
                        </Link>
                      ))}
                    </div>
                    <DrawerFooter className="pt-4">
                      <DrawerClose asChild>
                        <Button variant="outline">Close</Button>
                      </DrawerClose>
                    </DrawerFooter>
                  </DrawerContent>
                </Drawer>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        ) : null}
        {endItems.map((item, index) => (
          <BreadcrumbItem key={item.label}>
            {item.href ? (
              <>
                <BreadcrumbLink
                  asChild
                  className="max-w-20 truncate md:max-w-none"
                >
                  <Link href={item.href}>{item.label}</Link>
                </BreadcrumbLink>
                {index < endItems.length - 1 && <BreadcrumbSeparator />}
              </>
            ) : (
              <>
                <BreadcrumbPage className="max-w-20 truncate md:max-w-none">
                  {item.label}
                </BreadcrumbPage>
                {index < endItems.length - 1 && <BreadcrumbSeparator />}
              </>
            )}
          </BreadcrumbItem>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
