import { Card, CardContent, CardHeader } from '@workspace/ui/components/card'
import { Building2 } from 'lucide-react'
import { CreateOrganizationForm } from './_components/create-organization-form'

export default async function Page() {
  return (
    <div className="w-full max-w-xl p-4 md:p-10">
      <Card>
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border">
            <Building2 className="size-6 text-muted-foreground" />
          </div>

          <h1 className="text-center font-semibold text-xl leading-none">
            Create an organization
          </h1>
        </CardHeader>
        <CardContent className="mt-5">
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  )
}
