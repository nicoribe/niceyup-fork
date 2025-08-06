import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import Link from 'next/link'
import { Suspense } from 'react'
import { SignUpForm } from './_components/sign-up-form'

export default async function Page() {
  return (
    <div className="flex w-sm flex-col items-stretch justify-center gap-4 p-8">
      <Suspense>
        <SignUpForm />
      </Suspense>

      <Separator />

      <Button variant="secondary" asChild>
        <Link href="/auth/sign-in">Sign In</Link>
      </Button>
    </div>
  )
}
