import { Button } from '@workspace/ui/components/button'
import { CirclePlusIcon } from 'lucide-react'

export default async function Page() {
  return (
    <div className="flex size-full flex-1 flex-col">
      <div className="border-b bg-background p-4">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div className="flex items-center gap-4">
            <div className="md:max-w-sm">
              <h2 className="font-semibold text-sm">Sources</h2>
              <p className="mt-1 text-muted-foreground text-sm">
                Create, train, and manage data sources for your AI agents.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button disabled>
              New Source
              <CirclePlusIcon className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center gap-4 p-4">
        <p className="py-6 text-center text-muted-foreground text-xs">
          Coming soon
        </p>
      </div>
    </div>
  )
}
