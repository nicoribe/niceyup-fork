import { sdk } from '@/lib/sdk'

export default async function Page() {
  const { data } = await sdk.getProfile()

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-sm">Settings</h1>
      <pre className="text-xs">{JSON.stringify(data, null, 2)}</pre>
    </div>
  )
}
