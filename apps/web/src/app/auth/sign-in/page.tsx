import { Suspense } from 'react'
import { SignInForm } from './_components/sign-in-form'

export default async function Page() {
  return (
    <div className="flex w-sm flex-col items-stretch justify-center gap-4 p-8">
      <Suspense>
        <SignInForm />
      </Suspense>

      {/* <Separator /> */}

      {/* <Button variant="secondary" asChild>
        <Link href="/auth/sign-up">Sign Up</Link>
      </Button> */}
    </div>
  )
}
