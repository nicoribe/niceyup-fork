export default async function Page({
  params,
}: Readonly<{
  params: Promise<{ agentId: string }>
}>) {
  const { agentId } = await params

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <h1 className="text-sm">(Agent: {agentId}) Chats</h1>
    </div>
  )
}
