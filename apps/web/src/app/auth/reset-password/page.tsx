import { Button } from '@workspace/ui/components/button'
import { Separator } from '@workspace/ui/components/separator'
import Link from 'next/link'
import { Suspense } from 'react'
import { ResetPasswordForm } from './_components/reset-password-form'

export default async function Page({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ token: string }>
}>) {
  const { token } = await searchParams

  return (
    <div className="flex w-sm flex-col items-stretch justify-center gap-4 p-8">
      {token ? (
        <Suspense>
          <ResetPasswordForm token={token} />
        </Suspense>
      ) : (
        <div>
          <h1 className="font-bold text-xl">Invalid token</h1>
          <span className="text-muted-foreground text-sm">
            The token is invalid or has expired.
          </span>
        </div>
      )}

      <Separator />

      <Button variant="secondary" asChild>
        <Link href="/auth">Back</Link>
      </Button>
    </div>
  )
}
