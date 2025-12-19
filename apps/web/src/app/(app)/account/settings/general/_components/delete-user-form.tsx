'use client'

import { Button } from '@workspace/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@workspace/ui/components/dialog'

export function DeleteUserForm() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Personal Account</DialogTitle>
        </DialogHeader>

        <div>
          <p className="py-24 text-center text-muted-foreground text-xs">
            Coming soon
          </p>
        </div>
      </DialogContent>

      <div className="rounded-lg border border-destructive bg-background">
        <div className="relative flex flex-col space-y-6 p-5 sm:p-10">
          <div className="flex flex-col space-y-3">
            <h2 className="font-medium text-xl">Delete Account</h2>
            <p className="text-muted-foreground text-sm">
              Permanently remove your Personal Account and all of its contents
              from the Niceyup platform. This action is not reversible, so
              please continue with caution.
            </p>
          </div>
        </div>
        <div className="flex items-center justify-end space-x-4 rounded-b-lg border-destructive border-t bg-destructive/5 p-3 sm:px-10">
          <DialogTrigger asChild>
            <Button variant="destructive">Delete Personal Account</Button>
          </DialogTrigger>
        </div>
      </div>
    </Dialog>
  )
}
