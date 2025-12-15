import {
  Dialog,
  DialogHeader,
  DialogTitle,
} from '@workspace/ui/components/dialog'
import { InterceptedDialogContent } from '@workspace/ui/components/intercepted-dialog-content'
import { Building2Icon } from 'lucide-react'
import { CreateOrganizationForm } from '../../../onboarding/create-organization/_components/create-organization-form'

export default async function Page() {
  return (
    <Dialog defaultOpen>
      <InterceptedDialogContent>
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border">
            <Building2Icon className="size-6 text-muted-foreground" />
          </div>

          <DialogTitle className="text-center font-semibold text-xl leading-none">
            Create an organization
          </DialogTitle>
        </DialogHeader>
        <div className="mt-5">
          <CreateOrganizationForm modal />
        </div>
      </InterceptedDialogContent>
    </Dialog>
  )
}
