import { Header } from '@/components/header'
import { TabBar } from '@/components/tab-bar'

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
            deep: true,
          },
          // {
          //   label: 'Activity',
          //   href: '/account/activity',
          // },
          {
            label: 'Settings',
            href: '/account/settings',
            deep: true,
          },
        ]}
      />

      <main className="flex flex-1 flex-col items-center justify-center gap-4">
        {children}
      </main>
    </>
  )
}
