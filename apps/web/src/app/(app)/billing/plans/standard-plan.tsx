'use client'

import { authClient } from '@/lib/auth/client'
import { Button } from '@workspace/ui/components/button'
import { Spinner } from '@workspace/ui/components/spinner'
import { CheckCircleIcon } from 'lucide-react'
import Link from 'next/link'
import * as React from 'react'

const features = [
  'Full access to all features',
  'AI Agents',
  'Knowledge Sources',
]

export function StandardPlan({ isActive }: { isActive: boolean }) {
  const [isPending, startTransition] = React.useTransition()

  const handleUpgrade = async () => {
    startTransition(async () => {
      await authClient.checkout({ slug: 'standard' })
    })
  }

  return (
    <div className="flex w-full max-w-xs flex-col gap-5 rounded-lg border border-border bg-background p-5">
      <h2 className="font-bold text-xl">Standard Plan</h2>

      <p className="text-foreground text-sm leading-relaxed">
        The Standard plan is the best way to get started with Niceyup.
      </p>

      <h1 className="font-bold text-3xl">
        $5 <span className="text-muted-foreground text-sm">/month</span>
      </h1>

      {isActive ? (
        <Button className="w-full" asChild>
          <Link href="/account/settings/billing">Manage Billing</Link>
        </Button>
      ) : (
        <Button className="w-full" onClick={handleUpgrade} disabled={isPending}>
          {isPending && <Spinner />}
          Get Started
        </Button>
      )}

      <ul className="flex flex-col gap-2">
        {features.map((feature) => (
          <li className="flex items-start gap-2" key={feature}>
            <CheckCircleIcon className="mt-0.5 size-4 shrink-0 text-primary" />

            <span className="text-foreground text-sm">{feature}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
