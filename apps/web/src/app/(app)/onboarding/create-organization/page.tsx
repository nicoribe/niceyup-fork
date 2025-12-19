import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { Building2Icon } from 'lucide-react'
import { CreateOrganizationForm } from './_components/create-organization-form'

export default async function Page() {
  return (
    <div className="w-full max-w-xl p-4 md:p-10">
      <Card>
        <CardHeader>
          <div className="mx-auto flex size-12 items-center justify-center rounded-full border border-border">
            <Building2Icon className="size-6 text-muted-foreground" />
          </div>

          <CardTitle className="text-center font-semibold text-xl leading-none">
            Create an Organization
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-5">
          <CreateOrganizationForm />
        </CardContent>
      </Card>
    </div>
  )
}
