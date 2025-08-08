import { redirect } from 'next/navigation'

export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ organizationSlug: string }>
}>) {
  const { organizationSlug } = await params

  if (organizationSlug === 'my-account') {
    return redirect('/orgs/my-account/~/overview')
  }

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-sm">Create a team</h1>
    </div>
  )
}
