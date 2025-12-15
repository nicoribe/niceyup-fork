'use client'

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from '@workspace/ui/components/input-group'
import { CopyIcon } from 'lucide-react'

export function ViewTeamId({ id }: { id: string }) {
  return (
    <div className="rounded-lg border border-border bg-background">
      <div className="relative flex flex-col space-y-6 p-5 sm:p-10">
        <div className="flex flex-col space-y-3">
          <h2 className="font-medium text-xl">Team ID</h2>
          <p className="text-muted-foreground text-sm">
            This is your team's ID within Niceyup
          </p>
        </div>

        <InputGroup className="w-full max-w-md">
          <InputGroupInput defaultValue={id} readOnly />
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={async () => {
                await navigator.clipboard.writeText(id)
              }}
            >
              <CopyIcon />
            </InputGroupButton>
          </InputGroupAddon>
        </InputGroup>
      </div>
      <div className="flex items-center justify-start space-x-4 rounded-b-lg border-border border-t bg-foreground/2 p-3 sm:px-10">
        <p className="text-muted-foreground text-sm">
          Used when interacting with the Niceyup API
        </p>

        <div className="h-9" />
      </div>
    </div>
  )
}
