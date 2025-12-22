import { Logo } from '@/components/logo'
import { Separator } from '@workspace/ui/components/separator'
import { Skeleton } from '@workspace/ui/components/skeleton'
import Link from 'next/link'

export default function Loading() {
  return (
    <div className="flex min-h-svh flex-col items-stretch justify-center bg-background">
      <header className="flex flex-col items-center justify-center">
        <div className="no-scrollbar flex w-full items-center justify-between gap-4 overflow-auto px-4 py-2">
          <div className="flex items-center gap-1">
            <div className="px-2">
              <Link href="/">
                <Logo className="size-8" />
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Skeleton className="size-9" />

            <Separator
              orientation="vertical"
              className="data-[orientation=vertical]:h-4"
            />

            <Skeleton className="h-9 w-20" />
          </div>
        </div>

        <Separator />
      </header>

      <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4">
        <Skeleton className="h-62 w-full max-w-xs" />
      </main>
    </div>
  )
}
