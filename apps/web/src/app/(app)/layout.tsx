export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="flex min-h-svh flex-col items-stretch justify-center bg-foreground/3">
      {children}
    </div>
  )
}
