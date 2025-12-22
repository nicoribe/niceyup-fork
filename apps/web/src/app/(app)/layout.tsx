import { checkAccess } from '../access-required/_actions/check-access'

export default async function Layout({
  children,
  modals,
}: Readonly<{
  children: React.ReactNode
  modals: React.ReactNode
}>) {
  await checkAccess()

  return (
    <>
      <div className="flex min-h-svh flex-col items-stretch justify-center bg-foreground/3">
        {children}
      </div>

      {modals}
    </>
  )
}
