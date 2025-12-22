import { getActiveSubscription } from '@/actions/billing'
import { redirect } from 'next/navigation'

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const activeSubscription = await getActiveSubscription()

  if (!activeSubscription) {
    return redirect('/billing/plans')
  }

  return children
}
