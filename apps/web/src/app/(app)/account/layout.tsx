import { Header } from '@/components/organizations/header'
import { TabBar } from '@/components/organizations/tab-bar'

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      <Header selectedOrganizationLabel="My Account" />

      <TabBar
        tabs={[
          {
            label: 'Overview',
            href: '/account/overview',
          },
          {
            label: 'Activity',
            href: '/account/activity',
          },
          {
            label: 'Settings',
            href: '/account/settings',
          },
        ]}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {children}
      </main>
    </>
  )
}
