import { Separator } from '@workspace/ui/components/separator'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { SlashIcon } from 'lucide-react'

export default function Loading() {
  return (
    <div className="flex flex-1 flex-col bg-background">
      <header className="flex flex-col items-center justify-center bg-background">
        <div className="no-scrollbar flex w-full items-center justify-between gap-4 overflow-auto px-4 py-2">
          <div className="flex items-center gap-1">
            <div className="px-2">
              <Skeleton className="size-8" />
            </div>

            <SlashIcon className="-rotate-[24deg] size-3 text-border" />

            <Skeleton className="h-9 w-45" />
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

      <main className="flex flex-1 flex-col gap-4 p-4">
        <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-4">
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
          <Skeleton className="aspect-video" />
        </div>
        <Skeleton className="mx-auto max-h-300 w-full max-w-5xl flex-1" />
      </main>
    </div>
  )
}
