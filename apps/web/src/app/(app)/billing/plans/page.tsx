import { getActiveSubscription } from '@/actions/billing'
import { Header } from '@/components/header'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { StandardPlan } from './standard-plan'

export default async function Page() {
  const activeSubscription = await getActiveSubscription()

  return (
    <>
      <Header selectedOrganizationLabel="Onboarding" />

      <main className="relative flex flex-1 flex-col bg-background">
        <div className="flex flex-1 flex-col gap-4 p-4">
          <div className="mx-auto grid w-full max-w-5xl grid-cols-3 gap-4">
            <Skeleton className="aspect-video" />
            <Skeleton className="aspect-video" />
            <Skeleton className="aspect-video" />
          </div>
          <Skeleton className="mx-auto max-h-300 w-full max-w-5xl flex-1" />
        </div>

        <div className="absolute flex h-full max-h-300 w-full items-center justify-center">
          <StandardPlan isActive={!!activeSubscription} />
        </div>
      </main>
    </>
  )
}
