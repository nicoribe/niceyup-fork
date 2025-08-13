export default async function Layout({
  children,
  modals,
}: Readonly<{
  children: React.ReactNode
  modals: React.ReactNode
}>) {
  return (
    <>
      <div className="flex min-h-svh flex-col items-stretch justify-center bg-foreground/3">
        {children}
      </div>

      {modals}
    </>
  )
}
