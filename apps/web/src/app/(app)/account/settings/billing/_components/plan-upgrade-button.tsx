'use client'

import { authClient } from '@/lib/auth/client'
import { Button } from '@workspace/ui/components/button'

export function PlanUpgradeButton() {
  const handleUpgrade = async () => {
    await authClient.checkout({ slug: 'standard' })
  }

  return <Button onClick={handleUpgrade}>Upgrade</Button>
}
