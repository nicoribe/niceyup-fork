import { Dialog, DialogHeader } from '@workspace/ui/components/dialog'
import { InterceptedDialogContent } from '@workspace/ui/components/intercepted-dialog-content'
import { Building2 } from 'lucide-react'
import { CreateOrganizationForm } from '../../../onboarding/create-organization/_components/create-organization-form'

export default async function Page() {
  return (
    <Dialog defaultOpen>
      <InterceptedDialogContent>
        <DialogHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border">
            <Building2 className="size-6 text-muted-foreground" />
          </div>

          <h1 className="text-center font-semibold text-xl">
            Create an organization
          </h1>
        </DialogHeader>
        <div className="mt-5">
          <CreateOrganizationForm />
        </div>
      </InterceptedDialogContent>
    </Dialog>
  )
}
