import { getActiveSubscription } from '@/actions/billing'

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const activeSubscription = await getActiveSubscription()

  if (!activeSubscription) {
    return null
  }

  return children
}
