import { Card } from '@workspace/ui/components/card'

export default async function Page() {
  return (
    <div className="w-full max-w-xl p-4 md:p-10">
      <Card>
        <p className="text-sm">Create an agent</p>
      </Card>
    </div>
  )
}
