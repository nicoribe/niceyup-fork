import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'

export function Payload({ payload }: { payload: unknown }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Payload</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Payload</DialogTitle>
        </DialogHeader>

        <div className="overflow-hidden rounded-lg border border-dashed p-2">
          <div className="max-h-120 overflow-x-auto">
            <div className="p-2">
              <pre className="text-left text-foreground text-xs">
                {JSON.stringify(payload, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
