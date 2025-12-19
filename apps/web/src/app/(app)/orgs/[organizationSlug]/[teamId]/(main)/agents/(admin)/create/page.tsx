import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@workspace/ui/components/card'
import { CreateAgentForm } from './_components/create-agent-form'

export default async function Page() {
  return (
    <div className="w-full max-w-xl p-4 md:p-10">
      <Card>
        <CardHeader>
          <CardTitle className="text-center font-semibold text-xl leading-none">
            Create an Agent
          </CardTitle>
        </CardHeader>
        <CardContent className="mt-5">
          <CreateAgentForm />
        </CardContent>
      </Card>
    </div>
  )
}
