import { LeftSidebar } from './_components/left-sidebar'
import { Resizable } from './_components/resizable'
import { RightSidebar } from './_components/right-sidebar'

export default async function Layout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <Resizable leftSidebar={<LeftSidebar />} rightSidebar={<RightSidebar />}>
      {children}
    </Resizable>
  )
}
