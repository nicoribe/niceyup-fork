import { Header } from '@/components/organization/header'
import { TabBar } from '@/components/organization/tab-bar'

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
            label: 'Profile',
            href: '/account/profile',
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
